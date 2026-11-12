<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

// Public Authentication Routes
Route::post('/register', function (Request $request) {$request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6',
        'phone_number' => 'nullable|string',
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => strtolower(trim($request->email)),
        'password' => Hash::make($request->password),
        'role' => 'member',
        'phone_number' => $request->phone_number,
        'membership_tier' => 'Bronze',
    ]);

    $token =$user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'status' => 'success',
        'message' => 'Registration successful',
        'access_token' => $token,
        'token_type' => 'Bearer',
        'user' => $user
    ], 201);
});

Route::post('/login', function (Request $request) {$request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', strtolower(trim($request->email)))->first();

    if (! $user || ! Hash::check($request->password,$user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials do not match our records.'],
        ]);
    }

    $token =$user->createToken('auth_token')->plainTextToken;

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

    Route::post('/logout', function (Request $request) {$request->user()->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ], 200);
    });

    // Membership Management
    Route::post('/membership/register', [MembershipController::class, 'registerMembership']);
    Route::post('/membership/renew/checkout', [MembershipController::class, 'startRenewal']);
    Route::post('/membership/renew/capture', [MembershipController::class, 'captureRenewal']);
    Route::post('/membership/renew/cancel', [MembershipController::class, 'cancelRenewal']);
    Route::get('/membership/me', [MembershipController::class, 'mine']);
    Route::get('/admin/memberships', [MembershipController::class, 'index']);
    Route::get('/admin/memberships/{id}', [MembershipController::class, 'show']);
    Route::post('/admin/memberships/{id}/deactivate', [MembershipController::class, 'deactivate']);
    Route::post('/admin/memberships/{id}/renew', [MembershipController::class, 'adminRenew']);

    // Membership Management

    // Protected User Management CRUD
    Route::apiResource('users', UserController::class);

    // Protected Product Admin Operations (Create, Update, Delete)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    // Cart (Oscar)
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::put('/cart/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy']);
    Route::get('/my-orders', [CartController::class, 'orderHistory']);

    // Payments via PayPal sandbox (Oscar)
    Route::post('/checkout', [PaymentController::class, 'checkout']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/payments/{payment}/pay', [PaymentController::class, 'pay']);
    Route::post('/payments/{payment}/capture', [PaymentController::class, 'capture']);
    Route::post('/payments/{payment}/cancel', [PaymentController::class, 'cancel']);
    Route::put('/payments/{payment}', [PaymentController::class, 'update']); // admin only
});

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->name('password.store');