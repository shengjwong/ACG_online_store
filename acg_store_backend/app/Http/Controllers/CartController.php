<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * View the logged-in user's cart.
     */
    public function index(Request $request)
    {
        $items = CartItem::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        // Drop rows whose product was deleted by an admin
        $orphans = $items->filter(fn ($item) => $item->product === null);
        if ($orphans->isNotEmpty()) {
            CartItem::whereIn('id', $orphans->pluck('id'))->delete();
            $items = $items->reject(fn ($item) => $item->product === null)->values();
        }

        $subtotal = $items->sum(fn ($item) => $item->product->price * $item->quantity);

        return response()->json([
            'status' => 'success',
            'data' => [
                'items' => $items,
                'total_quantity' => $items->sum('quantity'),
                'subtotal' => round($subtotal, 2),
            ],
        ], 200);
    }

    /**
     * Add an item to the cart (adds to the quantity if it is already there).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id,deleted_at,NULL',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $quantity = $validated['quantity'] ?? 1;
        $product = Product::findOrFail($validated['product_id']);

        if ($product->status !== 'active') {
            return response()->json(['status' => 'error', 'message' => 'This product is not available.'], 422);
        }

        $item = CartItem::firstOrNew([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $newQuantity = ($item->exists ? $item->quantity : 0) + $quantity;

        if ($newQuantity > $product->stock) {
            return response()->json([
                'status' => 'error',
                'message' => "Only {$product->stock} in stock.",
            ], 422);
        }

        $item->quantity = $newQuantity;
        $item->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Item added to cart.',
            'data' => $item->load('product'),
        ], 201);
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(Request $request, CartItem $cartItem)
    {
        abort_unless($cartItem->user_id === $request->user()->id, 403, 'This cart item is not yours.');

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $product = $cartItem->product;

        if (! $product || $product->status !== 'active') {
            return response()->json(['status' => 'error', 'message' => 'This product is no longer available.'], 422);
        }

        if ($validated['quantity'] > $product->stock) {
            return response()->json([
                'status' => 'error',
                'message' => "Only {$product->stock} in stock.",
            ], 422);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cart updated.',
            'data' => $cartItem->load('product'),
        ], 200);
    }

    /**
     * Remove one item from the cart.
     */
    public function destroy(Request $request, CartItem $cartItem)
    {
        abort_unless($cartItem->user_id === $request->user()->id, 403, 'This cart item is not yours.');

        $cartItem->delete();

        return response()->json(['status' => 'success', 'message' => 'Item removed from cart.'], 200);
    }

    /**
     * Empty the whole cart.
     */
    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json(['status' => 'success', 'message' => 'Cart cleared.'], 200);
    }

    /**
     * Order history of the logged-in user (with payment info).
     */
    public function orderHistory(Request $request)
    {
        $orders = Order::with(['items', 'payment'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['status' => 'success', 'data' => $orders], 200);
    }
}
