<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\RewardsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\OrderController;

// Step 1: Send 6-Digit Registration OTP to User Email
Route::post('/register/send-otp', function (Request $request) {
    if ($request->filled('phone_number')) {
        $request->merge(['phone_number' => trim($request->phone_number)]);
    }

    $request->validate([
        'email' => [
            'required',
            'string',
            'email:rfc,dns',
            'max:255',
            'unique:users,email',
            'regex:/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|live\.com|[a-zA-Z0-9.-]+\.(edu\.my|com\.my|org|edu))$/i',
        ],
        'phone_number' => [
            'nullable',
            'string',
            'max:20',
            'unique:users,phone_number',
        ],
    ], [
        'email.unique'        => 'This email is already registered. Please log in instead.',
        'email.regex'         => 'Please enter a valid email domain (e.g. @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @icloud.com).',
        'email.email'         => 'Please enter a valid, active email address.',
        'phone_number.unique' => 'This phone number is already registered to another account.',
    ]);

    $email = strtolower(trim($request->email));
    $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Store OTP for 10 minutes
    Cache::put('register_otp_' . $email, Hash::make($otp), now()->addMinutes(10));

    try {
        Mail::raw(
            "Welcome to ACG Store!\n\nYour email verification code is: {$otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.",
            function ($message) use ($email) {
                $message->to($email)
                        ->subject('ACG Store - Email Verification OTP');
            }
        );
    } catch (\Exception $e) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Failed to send OTP email. Check your SMTP mail settings in .env (' . $e->getMessage() . ')',
        ], 500);
    }

    return response()->json([
        'status'  => 'success',
        'message' => 'Verification OTP sent to ' . $email,
    ], 200);
});

// Step 2: Verify OTP & Create Account
Route::post('/register', function (Request $request) {
    if ($request->filled('phone_number')) {
        $request->merge(['phone_number' => trim($request->phone_number)]);
    }

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => [
            'required',
            'string',
            'email:rfc,dns',
            'max:255',
            'unique:users,email',
            'regex:/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|live\.com|[a-zA-Z0-9.-]+\.(edu\.my|com\.my|org|edu))$/i',
        ],
        'otp' => 'required|string|size:6',
        'password' => 'required|string|min:6',
        'phone_number' => 'nullable|string|max:20|unique:users,phone_number',
    ], [
        'email.regex'         => 'Please enter a valid email domain (e.g. @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @icloud.com).',
        'email.email'         => 'Please enter a valid, active email address.',
        'phone_number.unique' => 'This phone number is already registered to another account.',
        'otp.required'        => 'Please enter the 6-digit OTP sent to your email.',
        'otp.size'            => 'The verification OTP must be 6 digits.',
    ]);

    $email = strtolower(trim($request->email));
    $cachedOtpHash = Cache::get('register_otp_' . $email);

    if (!$cachedOtpHash || !Hash::check(trim($request->otp), $cachedOtpHash)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid or expired verification OTP. Please request a new code.',
        ], 422);
    }

    // Clear OTP once verified
    Cache::forget('register_otp_' . $email);

    $user = User::create([
        'name' => trim($request->name),
        'email' => $email,
        'email_verified_at' => now(),
        'password' => Hash::make($request->password),
        'role' => 'member',
        'phone_number' => $request->phone_number ?: null,
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

    Route::post('/logout', function (Request $request) {
        $request->user()->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ], 200);
    });

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

    // Homepage Featured Slides Manager (Admin Only)
    Route::post('/admin/featured-slides', function (Request $request) {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'product_ids' => 'array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $ids = $validated['product_ids'] ?? [];

        Product::query()->update(['is_featured' => false]);
        if (!empty($ids)) {
            Product::whereIn('id', $ids)->update(['is_featured' => true]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Homepage slider updated successfully.',
        ]);
    });

    // Cart (Oscar)
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::put('/cart/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy']);
    Route::get('/my-orders', [OrderController::class, 'mine']);
    Route::put('/my-orders/{order}/address', [OrderController::class, 'updateAddress']);
    Route::post('/my-orders/{order}/cancel', [OrderController::class, 'cancelOrder']);
    Route::post('/my-orders/{order}/confirm-received', [OrderController::class, 'confirmReceived']);
    Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
    Route::put('/admin/orders/{order}', [OrderController::class, 'adminUpdate']);

    // Payments via PayPal sandbox (Oscar)
    Route::post('/checkout', [PaymentController::class, 'checkout']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::post('/payments/{payment}/pay', [PaymentController::class, 'pay']);
    Route::post('/payments/{payment}/capture', [PaymentController::class, 'capture']);
    Route::post('/payments/{payment}/cancel', [PaymentController::class, 'cancel']);
    Route::put('/payments/{payment}', [PaymentController::class, 'update']);
});

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->name('password.store');