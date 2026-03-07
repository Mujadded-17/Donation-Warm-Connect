<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class RegisteredUserController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:191', 'unique:user,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'user_type' => ['nullable', 'in:donor,receiver'],
        ]);

        $adminEmail = env('ADMIN_EMAIL', 'admin@example.com');

        $userType = 'receiver';

        if (strtolower($request->email) === strtolower($adminEmail)) {
            $userType = 'admin';
        } elseif ($request->user_type === 'donor') {
            $userType = 'donor';
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'pass_hash' => Hash::make($request->password),
            'phone' => $request->phone,
            'address' => $request->address,
            'user_type' => $userType,
        ]);

        event(new Registered($user));
        Auth::login($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ],
        ], 201);
    }
}