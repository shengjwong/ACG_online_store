<?php

namespace App\Http\Controllers;

use App\Models\MembershipPayment;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class MembershipController extends Controller
{
    private const RENEWAL_PRICE = 30.00;
    private const CURRENCY = 'MYR';

    public function __construct(private PayPalService $paypal) {}

    public function registerMembership(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role === 'member', 403, 'Only member accounts can register.');
        if ($user->membership_expiry && Carbon::parse($user->membership_expiry)->isFuture()) {
            return response()->json(['message' => 'You already have an active membership.'], 409);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone_number' => 'nullable|string|max:30',
        ]);
        if (isset($validated['name'])) $user->name = $validated['name'];
        if (array_key_exists('phone_number', $validated)) $user->phone_number = $validated['phone_number'];
        $user->membership_tier = 'Bronze';
        $user->membership_status = 'active';
        $user->membership_expiry = now()->addYear();
        $user->save();

        return response()->json(['status' => 'success', 'message' => 'Membership registration successful.', 'data' => $this->data($user->fresh())], 201);
    }

    public function mine(Request $request)
    {
        return response()->json(['status' => 'success', 'data' => $this->data($request->user())]);
    }

    public function index(Request $request)
    {
        $this->admin($request);
        return response()->json(['status' => 'success', 'data' => User::where('role', 'member')->latest()->get()->map(fn ($u) => $this->data($u))]);
    }

    public function show(Request $request, $id)
    {
        $this->admin($request);
        return response()->json(['status' => 'success', 'data' => $this->data(User::where('role', 'member')->findOrFail($id))]);
    }

    public function deactivate(Request $request, $id)
    {
        $this->admin($request);
        $user = User::where('role', 'member')->findOrFail($id);
        $user->membership_status = 'inactive';
        $user->save();
        return response()->json(['status' => 'success', 'message' => 'Membership deactivated.', 'data' => $this->data($user->fresh())]);
    }

    public function adminRenew(Request $request, $id)
    {
        $this->admin($request);
        return response()->json(['message' => 'Admin renewal without payment is disabled. Members must pay RM30 through PayPal.'], 422);
    }

    public function startRenewal(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role === 'member', 403, 'Only members can renew.');
        $payment = MembershipPayment::create([
            'user_id' => $user->id, 'amount' => self::RENEWAL_PRICE,
            'currency' => self::CURRENCY, 'status' => 'pending',
        ]);

        try {
            $frontend = rtrim(config('services.paypal.frontend_url'), '/');
            $paypal = $this->paypal->createOrder(
                'MEM-' . $user->id . '-' . $payment->id . '-' . Str::lower(Str::random(5)),
                self::RENEWAL_PRICE, 0,
                [['name' => 'Bronze Membership Renewal (1 year)', 'quantity' => 1, 'unit_price' => self::RENEWAL_PRICE]],
                $frontend . '/membership/payment/success?membership_payment_id=' . $payment->id,
                $frontend . '/membership/payment/cancel?membership_payment_id=' . $payment->id
            );
            $payment->update(['paypal_order_id' => $paypal['id']]);
            return response()->json(['status' => 'success', 'payment_id' => $payment->id, 'approval_url' => $paypal['approval_url'], 'amount' => self::RENEWAL_PRICE, 'currency' => self::CURRENCY], 201);
        } catch (Throwable $e) {
            report($e);
            $payment->update(['status' => 'failed']);
            return response()->json(['status' => 'error', 'message' => 'Unable to start PayPal payment. Check PayPal Sandbox credentials in .env.'], 502);
        }
    }

    public function captureRenewal(Request $request)
    {
        $validated = $request->validate(['payment_id' => 'required|integer', 'paypal_order_id' => 'required|string']);
        $payment = MembershipPayment::where('user_id', $request->user()->id)->findOrFail($validated['payment_id']);
        abort_unless($payment->paypal_order_id === $validated['paypal_order_id'], 422, 'PayPal order does not match this renewal.');
        if ($payment->status === 'successful') {
            return response()->json(['status' => 'success', 'message' => 'Renewal already applied.', 'data' => $this->data($request->user()->fresh())]);
        }

        try {
            $result = $this->paypal->captureOrder($validated['paypal_order_id']);
        } catch (Throwable $e) {
            report($e);
            return response()->json(['message' => 'PayPal capture failed. Please try again.'], 502);
        }
        $capture = $result['purchase_units'][0]['payments']['captures'][0] ?? null;
        if (($result['status'] ?? '') !== 'COMPLETED' || ($capture['status'] ?? '') !== 'COMPLETED') {
            return response()->json(['message' => 'PayPal payment is not completed. Membership was not renewed.'], 409);
        }

        DB::transaction(function () use ($payment, $capture, $request) {
            $payment->update(['status' => 'successful', 'capture_id' => $capture['id'], 'paid_at' => now()]);
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $expiry = $user->membership_expiry ? Carbon::parse($user->membership_expiry) : null;
            $base = ($user->membership_status === 'active' && $expiry && $expiry->isFuture()) ? $expiry : now();
            $user->membership_tier = 'Bronze';
            $user->membership_status = 'active';
            $user->membership_expiry = $base->copy()->addYear();
            $user->save();
        });

        return response()->json(['status' => 'success', 'message' => 'RM30 payment successful. Membership renewed for one year.', 'data' => $this->data($request->user()->fresh())]);
    }

    public function cancelRenewal(Request $request)
    {
        $validated = $request->validate(['payment_id' => 'required|integer']);
        $payment = MembershipPayment::where('user_id', $request->user()->id)->findOrFail($validated['payment_id']);
        if ($payment->status === 'pending') $payment->update(['status' => 'failed']);
        return response()->json(['status' => 'success', 'message' => 'Renewal payment cancelled. Membership was not changed.']);
    }

    private function admin(Request $request): void
    {
        abort_unless($request->user() && $request->user()->role === 'admin', 403, 'Admin access only.');
    }

    private function data(User $user): array
    {
        $expiry = $user->membership_expiry ? Carbon::parse($user->membership_expiry) : null;
        $status = $user->membership_status ?? 'inactive';
        if ($status === 'active' && $expiry && $expiry->isPast()) $status = 'expired';
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone_number' => $user->phone_number, 'profile_image' => $user->profile_image, 'role' => $user->role, 'membership_tier' => $user->membership_tier ?? 'Normal', 'membership_status' => $status, 'membership_expiry' => $user->membership_expiry, 'created_at' => $user->created_at];
    }
}
