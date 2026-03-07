<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthenticatedSessionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->pass_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        Auth::login($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ],
        ]);
    }

    public function destroy(Request $request)
    {
        Auth::logout();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}