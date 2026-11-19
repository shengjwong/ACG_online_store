<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->latest()->get()
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'status' => 'in:active,inactive',
        ]);

        // Find existing category (case-insensitive) or create a new one automatically
        $cleanCategoryName = trim($validated['category_name']);
        $category = Category::whereRaw('LOWER(name) = ?', [strtolower($cleanCategoryName)])->first();

        if (!$category) {
            $category = Category::create([
                'name' => $cleanCategoryName,
                'slug' => Str::slug($cleanCategoryName) . '-' . Str::random(4),
                'description' => $cleanCategoryName . ' products',
            ]);
        }

        $validated['category_id'] = $category->id;
        unset($validated['category_name']);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Product created successfully',
            'data' => $product->load('category')
        ], 201);
    }

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

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validated = $request->validate([
            'category_name' => 'sometimes|required|string|max:100',
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'status' => 'in:active,inactive',
        ]);

        if (isset($validated['category_name'])) {
            $cleanCategoryName = trim($validated['category_name']);
            $category = Category::whereRaw('LOWER(name) = ?', [strtolower($cleanCategoryName)])->first();

            if (!$category) {
                $category = Category::create([
                    'name' => $cleanCategoryName,
                    'slug' => Str::slug($cleanCategoryName) . '-' . Str::random(4),
                    'description' => $cleanCategoryName . ' products',
                ]);
            }

            $validated['category_id'] = $category->id;
            unset($validated['category_name']);
        }

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

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

    public function destroy($id)
    {
        $product = Product::withTrashed()->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

        $product->forceDelete();

        return response()->json([
            'status' => 'success',
            'message' => 'Product permanently deleted'
        ], 200);
    }
}