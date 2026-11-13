<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /** Customer order list, including shipment progress and completed history. */
    public function mine(Request $request)
    {
        $orders = Order::with(['items', 'payment'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['status' => 'success', 'data' => $orders]);
    }


    /** Customer may edit the delivery address before the order is shipped. */
    public function updateAddress(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 403, 'This order is not yours.');

        if (in_array($order->order_status, ['shipped', 'delivered', 'completed'], true)) {
            return response()->json(['status' => 'error', 'message' => 'The delivery address can no longer be changed after shipping.'], 422);
        }

        $validated = $request->validate([
            'shipping_address' => 'required|string|min:10|max:2000',
        ]);

        $order->update($validated);

        return response()->json(['status' => 'success', 'message' => 'Delivery address updated.', 'data' => $order->fresh()]);
    }

    /** Customer confirms receipt only after the order is marked delivered. */
    public function confirmReceived(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 403, 'This order is not yours.');

        if ($order->order_status === 'completed') {
            return response()->json(['status' => 'success', 'message' => 'Order already completed.', 'data' => $order]);
        }

        if ($order->order_status !== 'delivered') {
            return response()->json(['status' => 'error', 'message' => 'You can confirm receipt after the order is delivered.'], 422);
        }

        $order->update(['order_status' => 'completed', 'completed_at' => now()]);

        return response()->json(['status' => 'success', 'message' => 'Receipt confirmed. Thank you!', 'data' => $order->fresh()->load(['items', 'payment'])]);
    }

    /** Admin view of all paid orders. */
    public function adminIndex(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Admins only.');

        $query = Order::with(['items', 'payment', 'user:id,name,email'])
            ->whereHas('payment', fn ($q) => $q->where('payment_status', 'successful'))
            ->latest();

        if ($request->filled('status')) {
            $query->where('order_status', $request->status);
        }

        return response()->json(['status' => 'success', 'data' => $query->get()]);
    }

    /** Admin updates progress, tracking number and estimated delivery dates. */
    public function adminUpdate(Request $request, Order $order)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Admins only.');

        $validated = $request->validate([
            'order_status' => ['required', Rule::in(['paid', 'processing', 'shipped', 'delivered'])],
            'tracking_number' => 'nullable|string|max:100',
            'estimated_delivery_start' => 'required|date',
            'estimated_delivery_end' => 'required|date|after_or_equal:estimated_delivery_start',
        ]);

        if ($order->order_status === 'completed') {
            return response()->json(['status' => 'error', 'message' => 'Completed orders cannot be changed.'], 422);
        }

        $changes = $validated;
        if ($validated['order_status'] === 'shipped' && ! $order->shipped_at) {
            $changes['shipped_at'] = now();
        }
        if ($validated['order_status'] === 'delivered') {
            $changes['delivered_at'] = $order->delivered_at ?? now();
        }

        $order->update($changes);

        return response()->json(['status' => 'success', 'message' => 'Order updated.', 'data' => $order->fresh()->load(['items', 'payment', 'user:id,name,email'])]);
    }
}
