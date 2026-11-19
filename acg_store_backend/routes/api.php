<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\MembershipController;
<<<<<<< HEAD
use App\Http\Controllers\RewardsController;
=======
>>>>>>> 1f86f6a (Update membership backend)
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
<<<<<<< HEAD
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\OrderController;
=======
>>>>>>> 1f86f6a (Update membership backend)

// Public Authentication Routes
Route::post('/register', function (Request $request) {
    $request->validate([
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

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'status' => 'success',
        'message' => 'Registration successful',
        'access_token' => $token,
        'token_type' => 'Bearer',
        'user' => $user
    ], 201);
});

Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', strtolower(trim($request->email)))->first();

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
<<<<<<< HEAD

    Route::post('/logout', function (Request $request) {
        $request->user()->tokens()->delete();
=======
    Route::post('/logout', function (Request $request) {$request->user()->tokens()->delete();
>>>>>>> 1f86f6a (Update membership backend)

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ], 200);
    });

<<<<<<< HEAD
    // User & Admin Profile + Password OTP Routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('/profile/send-otp', [ProfileController::class, 'sendPasswordOtp']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePasswordWithOtp']);

    // Membership Management
    Route::post('/membership/register', [MembershipController::class, 'registerMembership']);
    Route::post('/membership/renew/checkout', [MembershipController::class, 'startRenewal']);
    Route::post('/membership/renew/capture', [MembershipController::class, 'captureRenewal']);
    Route::post('/membership/renew/cancel', [MembershipController::class, 'cancelRenewal']);
    Route::get('/membership/me', [MembershipController::class, 'mine']);
    Route::get('/membership/payment-history', [MembershipController::class, 'paymentHistory']);
    Route::get('/points', [RewardsController::class, 'points']);
    Route::get('/rewards', [RewardsController::class, 'index']);
    Route::post('/rewards/{rewardProduct}/redeem', [RewardsController::class, 'redeem']);
    Route::get('/my-redemptions', [RewardsController::class, 'myRedemptions']);
    Route::get('/admin/rewards', [RewardsController::class, 'adminIndex']);
    Route::post('/admin/rewards', [RewardsController::class, 'store']);
    Route::put('/admin/rewards/{rewardProduct}', [RewardsController::class, 'update']);
    Route::delete('/admin/rewards/{rewardProduct}', [RewardsController::class, 'destroy']);
    Route::get('/admin/redemptions', [RewardsController::class, 'adminRedemptions']);
=======
    // Membership Management
    Route::post('/membership/register', [MembershipController::class, 'registerMembership']);
    Route::get('/membership/me', [MembershipController::class, 'mine']);
    Route::post('/membership/renew', [MembershipController::class, 'renew']);
>>>>>>> 1f86f6a (Update membership backend)
    Route::get('/admin/memberships', [MembershipController::class, 'index']);
    Route::get('/admin/memberships/{id}', [MembershipController::class, 'show']);
    Route::post('/admin/memberships/{id}/deactivate', [MembershipController::class, 'deactivate']);
    Route::post('/admin/memberships/{id}/renew', [MembershipController::class, 'adminRenew']);

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
<<<<<<< HEAD
    Route::get('/my-orders', [OrderController::class, 'mine']);
    Route::put('/my-orders/{order}/address', [OrderController::class, 'updateAddress']);
    Route::post('/my-orders/{order}/cancel', [OrderController::class, 'cancelOrder']);
    Route::post('/my-orders/{order}/confirm-received', [OrderController::class, 'confirmReceived']);
    Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
    Route::put('/admin/orders/{order}', [OrderController::class, 'adminUpdate']);
=======
    Route::get('/my-orders', [CartController::class, 'orderHistory']);
>>>>>>> 1f86f6a (Update membership backend)

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