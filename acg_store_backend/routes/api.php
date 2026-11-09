<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

// Public Authentication Routes
Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials do not match our records.'],
        ]);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'status' => 'success',
        'message' => 'Login successful',
        'access_token' => $token,
        'token_type' => 'Bearer',
        'user' => $user
    ], 200);
});

// Public Product Routes (For store showcase)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);

// Protected Routes (Sanctum Authenticated)
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', function (Request $request) {
        $request->user()->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ], 200);
    });

    // Protected User Management CRUD
    Route::apiResource('users', UserController::class);

    // Protected Product Admin Operations (Create, Update, Delete)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
});