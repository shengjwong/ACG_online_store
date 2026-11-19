<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Reusable email domain validation rules (blocks typos like @gmal.com).
     */
    private function emailValidationRules(?int $ignoreUserId = null): array
    {
        $uniqueRule = $ignoreUserId
            ? Rule::unique('users', 'email')->ignore($ignoreUserId)
            : Rule::unique('users', 'email');

        return [
            $ignoreUserId ? 'sometimes' : 'required',
            'string',
            'email:rfc,dns',
            'max:255',
            $uniqueRule,
            'regex:/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|live\.com|[a-zA-Z0-9.-]+\.(edu\.my|com\.my|org|edu))$/i',
        ];
    }

    private function emailValidationMessages(): array
    {
        return [
            'email.regex' => 'Please enter a valid email domain (e.g. @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @icloud.com).',
            'email.email' => 'Please enter a valid, active email address.',
        ];
    }

    /**
     * Display a listing of all users & admins.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->latest()->get()
        ], 200);
    }

    /**
     * Create a new User or Admin.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => $this->emailValidationRules(),
            'password'      => 'required|string|min:8',
            'role'          => ['required', Rule::in(['admin', 'member'])],
            'phone_number'  => 'nullable|string|max:20|unique:users,phone_number',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
        ], $this->emailValidationMessages());

        $validated['email'] = strtolower(trim($validated['email']));
        $validated['password'] = Hash::make($validated['password']);

        if ($request->hasFile('profile_image')) {
            $validated['profile_image'] = $request->file('profile_image')->store('profiles', 'public');
        } else {
            unset($validated['profile_image']);
        }

        $user = User::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully',
            'data'    => $user
        ], 201);
    }

    /**
     * Display the specified user profile.
     */
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $user
        ], 200);
    }

    /**
     * Update user/admin information.
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => $this->emailValidationRules($user->id),
            'phone_number'  => ['nullable', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'password'      => 'nullable|string|min:8',
            'role'          => ['sometimes', Rule::in(['admin', 'member'])],
            'profile_image' => 'nullable',
        ], $this->emailValidationMessages());

        if (isset($validated['email'])) {
            $validated['email'] = strtolower(trim($validated['email']));
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if ($request->hasFile('profile_image')) {
            $request->validate([
                'profile_image' => 'image|mimes:jpeg,png,jpg,webp|max:10240'
            ]);

            if ($user->profile_image && $user->profile_image !== 'default.png' && Storage::disk('public')->exists($user->profile_image)) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $validated['profile_image'] = $request->file('profile_image')->store('profiles', 'public');
        } else {
            unset($validated['profile_image']);
        }

        $user->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'User information updated successfully',
            'data'    => $user->fresh()
        ], 200);
    }

    /**
     * Delete user/admin permanently from the database.
     */
    public function destroy($id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Cannot delete your own active account'], 400);
        }

        if ($user->profile_image && $user->profile_image !== 'default.png' && Storage::disk('public')->exists($user->profile_image)) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $user->forceDelete();

        return response()->json([
            'status'  => 'success',
            'message' => 'User permanently deleted'
        ], 200);
    }
}