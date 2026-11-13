<?php

namespace App\Http\Controllers;

use App\Mail\PaymentReceiptMail;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class PaymentController extends Controller
{
    /** Flat shipping fee (RM). Change here if your group decides on a fee. */
    private const SHIPPING_FEE = 0.00;

    public function __construct(private PayPalService $paypal)
    {
    }

    /**
     * Payment history. Members see their own, admins see everyone's.
     * Optional filter: ?status=pending|successful|failed|refunded
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Payment::with(['order.items', 'order.user:id,name,email'])->latest();

        if ($user->role !== 'admin') {
            $query->whereHas('order', fn ($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('status')) {
            $query->where('payment_status', $request->status);
        }

        // Search by order number, PayPal transaction id, or customer name/email
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('transaction_id', 'like', $term)
                    ->orWhereHas('order', function ($o) use ($term) {
                        $o->where('order_number', 'like', $term)
                            ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term));
                    });
            });
        }

        return response()->json(['status' => 'success', 'data' => $query->get()], 200);
    }

    public function show(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment, allowAdmin: true);

        return response()->json([
            'status' => 'success',
            'data' => $payment->load(['order.items', 'order.user:id,name,email']),
        ], 200);
    }

    /**
     * Make payment, step 1: turn the cart into an order and send the user to PayPal.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string|max:500',
        ]);

        $user = $request->user();
        $cartItems = CartItem::with('product')->where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['status' => 'error', 'message' => 'Your cart is empty.'], 422);
        }

        foreach ($cartItems as $item) {
            $product = $item->product;
            if (! $product || $product->status !== 'active') {
                return response()->json(['status' => 'error', 'message' => 'A product in your cart is no longer available.'], 422);
            }
            if ($item->quantity > $product->stock) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Not enough stock for {$product->name} (only {$product->stock} left).",
                ], 422);
            }
        }

        $payment = DB::transaction(function () use ($user, $cartItems, $validated) {
            $subtotal = $cartItems->sum(fn ($i) => $i->product->price * $i->quantity);
            $shipping = self::SHIPPING_FEE;

            $order = Order::create([
                'order_number' => 'ORD-' . strtoupper(Str::random(10)),
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'shipping_fee' => $shipping,
                'total_amount' => $subtotal + $shipping,
                'shipping_address' => $validated['shipping_address'],
                'order_status' => 'pending',
            ]);

            foreach ($cartItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'unit_price' => $item->product->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->product->price * $item->quantity,
                ]);
            }

            return Payment::create([
                'order_id' => $order->id,
                'payment_method' => 'paypal',
                'amount' => $order->total_amount,
                'payment_status' => 'pending',
            ]);
        });

        return $this->startPayPal($payment);
    }

    /**
     * Pay again for an order whose payment is still pending (e.g. the user closed the PayPal window).
     */
    public function pay(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);

        if ($payment->payment_status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'This payment is not pending.'], 422);
        }

        return $this->startPayPal($payment);
    }

    /**
     * Make payment, step 2: called by the frontend after PayPal redirects the buyer back.
     */
    public function capture(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);

        $validated = $request->validate(['paypal_order_id' => 'required|string']);

        if ($payment->payment_status === 'successful') {
            return response()->json(['status' => 'success', 'message' => 'Payment already completed.', 'data' => $payment->load('order')], 200);
        }

        if ($payment->payment_status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'This payment can no longer be completed.'], 422);
        }

        $stored = $payment->payload_response ?? [];
        if (($stored['paypal_order_id'] ?? null) !== $validated['paypal_order_id']) {
            return response()->json(['status' => 'error', 'message' => 'PayPal order does not match this payment.'], 422);
        }

        try {
            $result = $this->paypal->captureOrder($validated['paypal_order_id']);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['status' => 'error', 'message' => 'Could not complete the PayPal payment. Please try again.'], 502);
        }

        $capture = $result['purchase_units'][0]['payments']['captures'][0] ?? null;

        if (($result['status'] ?? '') !== 'COMPLETED' || ! $capture || ($capture['status'] ?? '') !== 'COMPLETED') {
            $payment->update(['payload_response' => array_merge($stored, ['last_response' => $result])]);

            return response()->json([
                'status' => 'error',
                'message' => 'PayPal has not completed this payment yet.',
            ], 409);
        }

        DB::transaction(function () use ($payment, $stored, $capture, $result) {
            $payment->update([
                'transaction_id' => $capture['id'],
                'payment_status' => 'successful',
                'paid_at' => now(),
                'payload_response' => array_merge($stored, [
                    'capture_id' => $capture['id'],
                    'payer_email' => $result['payment_source']['paypal']['email_address'] ?? null,
                    'capture_response' => $result,
                ]),
            ]);

            $order = $payment->order()->with('items')->first();
            $order->update(['order_status' => 'paid']);

            foreach ($order->items as $item) {
                if ($item->product_id) {
                    // Never let stock go below zero
                    Product::whereKey($item->product_id)->update([
                        'stock' => DB::raw('GREATEST(stock - ' . (int) $item->quantity . ', 0)'),
                    ]);
                }
            }

            CartItem::where('user_id', $order->user_id)
                ->whereIn('product_id', $order->items->pluck('product_id')->filter())
                ->delete();
        });

        $payment = $payment->fresh()->load('order.items', 'order.user');

        // Email receipt. A mail failure must never undo a completed payment.
        try {
            Mail::to($payment->order->user->email)->send(new PaymentReceiptMail($payment));
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Payment successful.',
            'data' => $payment,
        ], 200);
    }

    /**
     * User cancels a payment that is still pending. The order is cancelled too.
     */
    public function cancel(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);

        if ($payment->payment_status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Only pending payments can be cancelled.'], 422);
        }

        DB::transaction(function () use ($payment) {
            $payment->update(['payment_status' => 'failed']);
            $payment->order()->update([
                'order_status' => 'cancelled',
                'cancel_reason' => 'Payment cancelled by user',
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Payment cancelled.',
            'data' => $payment->fresh()->load('order'),
        ], 200);
    }

    /**
     * Admin updates a payment's status. Refunding a PayPal payment also refunds it on PayPal.
     */
    public function update(Request $request, Payment $payment)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Admins only.');

        $validated = $request->validate([
            'payment_status' => 'required|in:pending,successful,failed,refunded',
        ]);

        $new = $validated['payment_status'];
        $old = $payment->payment_status;

        if ($new === $old) {
            return response()->json(['status' => 'success', 'message' => 'No change.', 'data' => $payment->load('order')], 200);
        }

        $stored = $payment->payload_response ?? [];

        // Real PayPal refund when we have a captured PayPal payment
        if ($new === 'refunded' && $old === 'successful' && ! empty($stored['capture_id'])) {
            try {
                $refund = $this->paypal->refundCapture($stored['capture_id']);
                $stored['refund_response'] = $refund;
            } catch (Throwable $e) {
                report($e);
                return response()->json(['status' => 'error', 'message' => 'PayPal refund failed. Status not changed.'], 502);
            }
        }

        DB::transaction(function () use ($request, $payment, $new, $stored) {
            $payment->update([
                'payment_status' => $new,
                'payload_response' => $stored ?: $payment->payload_response,
                'paid_at' => $new === 'successful' ? ($payment->paid_at ?? now()) : $payment->paid_at,
            ]);

            $order = $payment->order;
            $orderUpdate = ['processed_by_admin_id' => $request->user()->id];

            if ($new === 'successful' && $order->order_status === 'pending') {
                $orderUpdate['order_status'] = 'paid';
            } elseif (in_array($new, ['failed', 'refunded'], true) && in_array($order->order_status, ['pending', 'paid'], true)) {
                $orderUpdate['order_status'] = 'cancelled';
                $orderUpdate['cancel_reason'] = $new === 'refunded' ? 'Payment refunded by admin' : 'Payment marked failed by admin';
            }

            $order->update($orderUpdate);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Payment updated.',
            'data' => $payment->fresh()->load(['order.items', 'order.user:id,name,email']),
        ], 200);
    }

    // ---------------------------------------------------------------------

    /**
     * Create the PayPal order for a pending payment and return the approval URL.
     */
    private function startPayPal(Payment $payment)
    {
        $order = $payment->order()->with('items')->first();
        $frontend = rtrim(config('services.paypal.frontend_url'), '/');

        try {
            $paypalOrder = $this->paypal->createOrder(
                $order->order_number . '-' . $payment->id . '-' . Str::lower(Str::random(4)),
                (float) $order->subtotal,
                (float) $order->shipping_fee,
                $order->items->map(fn ($i) => [
                    'name' => $i->product_name,
                    'quantity' => $i->quantity,
                    'unit_price' => (float) $i->unit_price,
                ])->all(),
                "{$frontend}/payment/success?payment_id={$payment->id}",
                "{$frontend}/payment/cancel?payment_id={$payment->id}",
            );
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'status' => 'error',
                'message' => 'Could not start the PayPal payment. Please try again.',
                'payment_id' => $payment->id,
            ], 502);
        }

        $payment->update([
            'transaction_id' => $paypalOrder['id'],
            'payload_response' => ['paypal_order_id' => $paypalOrder['id']],
        ]);

        return response()->json([
            'status' => 'success',
            'payment_id' => $payment->id,
            'order_id' => $order->id,
            'approval_url' => $paypalOrder['approval_url'],
        ], 201);
    }

    private function authorizePayment(Request $request, Payment $payment, bool $allowAdmin = false): void
    {
        $user = $request->user();
        $isOwner = $payment->order && $payment->order->user_id === $user->id;
        $isAdmin = $allowAdmin && $user->role === 'admin';

        abort_unless($isOwner || $isAdmin, 403, 'This payment is not yours.');
    }
}
