<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ProfileController extends Controller
{
    // Get currently authenticated user (works for both member and admin)
    public function show(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    // Update profile info (name, phone_number, profile_image)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:25',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user->name = $request->name;
        $user->phone_number = $request->phone_number;

        if ($request->hasFile('profile_image')) {
            // Delete old custom profile image if it exists
            if ($user->profile_image && $user->profile_image !== 'default.png') {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $request->file('profile_image')->store('profiles', 'public');
            $user->profile_image = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ]);
    }

    // Step 1: Send 6-digit OTP to user's/admin's registered email
    public function sendPasswordOtp(Request $request)
    {
        $user = $request->user();

        // Generate 6-digit numeric OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Remove any previous unused OTPs for this user
        DB::table('password_change_otps')->where('user_id', $user->id)->delete();

        DB::table('password_change_otps')->insert([
            'user_id' => $user->id,
            'otp' => $otp,
            'expires_at' => Carbon::now()->addMinutes(10),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Send OTP using your configured Gmail SMTP
        Mail::raw(
            "Hello {$user->name},\n\nYour ACG Store password change verification OTP is: {$otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.",
            function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('ACG Store - Password Change OTP');
            }
        );

        return response()->json([
            'message' => "A 6-digit OTP has been sent to {$user->email}."
        ]);
    }

    // Step 2: Verify OTP and update password
    public function changePasswordWithOtp(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'otp' => 'required|string|size:6',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_change_otps')
            ->where('user_id', $user->id)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid OTP code.'], 422);
        }

        if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
            DB::table('password_change_otps')->where('id', $record->id)->delete();
            return response()->json(['message' => 'OTP has expired. Please request a new one.'], 422);
        }

        // Update password and clean up OTP
        $user->password = Hash::make($request->new_password);
        $user->save();

        DB::table('password_change_otps')->where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Password changed successfully!'
        ]);
    }
}