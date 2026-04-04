<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    // Get user profile
    public function show($userId)
    {
        $user = User::where('user_id', $userId)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'user_type' => $user->user_type,
                'profile_url' => $user->profile_url ?? null,
            ],
        ]);
    }

    // Update user profile
    public function update(Request $request, $userId)
    {
        $user = User::where('user_id', $userId)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:191',
                Rule::unique('user', 'email')->ignore($user->user_id, 'user_id'),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'profile_url' => ['nullable', 'string', 'max:255'],
        ]);

        // Update fields
        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;
        $user->address = $request->address;
        $user->profile_url = $request->profile_url;

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'user_type' => $user->user_type,
                'profile_url' => $user->profile_url ?? null,
            ],
        ]);
    }
}