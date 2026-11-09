<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes (Accessible by anyone / Frontend Storefront)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Protected Routes (Require Authentication via Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {
    
    // User Profile Routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Product Management Routes (Admin)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // User Management Routes (Admin)
    Route::apiResource('users', UserController::class);
});