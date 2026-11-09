<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Force-delete existing records including soft-deleted items to reset cleanly
        Product::withTrashed()->forceDelete();
        Category::withTrashed()->forceDelete();

        $figureCategory = Category::create([
            'name' => 'Figures',
            'slug' => 'figures',
            'description' => 'Scale figures and Nendoroids'
        ]);

        $mangaCategory = Category::create([
            'name' => 'Manga',
            'slug' => 'manga',
            'description' => 'Japanese manga volumes and box sets'
        ]);

        Product::create([
            'category_id' => $figureCategory->id,
            'name' => 'Genshin Impact - Raiden Shogun 1/7 Scale Figure',
            'slug' => 'genshin-impact-raiden-shogun-1-7-scale-figure',
            'sku' => 'FIG-GEN-001',
            'description' => 'Official high quality pre-painted PVC figure of Raiden Shogun.',
            'price' => 899.00,
            'stock' => 10,
            'image' => 'products/sample-figure.jpg',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $mangaCategory->id,
            'name' => 'Chainsaw Man Vol. 1',
            'slug' => 'chainsaw-man-vol-1',
            'sku' => 'MAN-CSM-001',
            'description' => 'English edition paperback manga by Tatsuki Fujimoto.',
            'price' => 45.00,
            'stock' => 50,
            'image' => 'products/sample-manga.jpg',
            'status' => 'active',
        ]);
    }
}