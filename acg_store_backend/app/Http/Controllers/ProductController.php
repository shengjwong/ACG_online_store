<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     * Shows all products by default (for Admin), or filters by status if requested.
     */
    public function index(Request $request)
    {
        $query = Product::with('category');

        // Allow filtering by status (e.g. ?status=active for shop view)
        // If no status is specified, return all items so Admin panel shows inactive products too
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Optional filtering by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Optional search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->latest()->get()
        ], 200);
    }

    /**
     * Store a newly created product (Admin Function).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'status' => 'in:active,inactive',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        // Handle image upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Product created successfully',
            'data' => $product->load('category')
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $product = Product::with('category')->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $product
        ], 200);
    }

    /**
     * Update the specified product (Admin Function).
     */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'status' => 'in:active,inactive',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        // Handle new image upload & remove old image
        if ($request->hasFile('image')) {
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Product updated successfully',
            'data' => $product->fresh('category')
        ], 200);
    }

    /**
     * Remove the specified product using soft delete (Admin Function).
     */
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $product->delete(); // Soft delete

        return response()->json([
            'status' => 'success',
            'message' => 'Product deleted successfully'
        ], 200);
    }
}