<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class AuthenticatedSessionController extends Controller
{
    private function ensureBanColumns(): void
    {
        if (!Schema::hasColumn('user', 'is_banned')) {
            Schema::table('user', function (Blueprint $table) {
                $table->boolean('is_banned')->default(false)->after('profile_url');
            });
        }

        if (!Schema::hasColumn('user', 'ban_reason')) {
            Schema::table('user', function (Blueprint $table) {
                $table->string('ban_reason', 255)->nullable()->after('is_banned');
            });
        }

        if (!Schema::hasColumn('user', 'banned_at')) {
            Schema::table('user', function (Blueprint $table) {
                $table->dateTime('banned_at')->nullable()->after('ban_reason');
            });
        }
    }

    public function store(Request $request)
    {
        $this->ensureBanColumns();

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

        if ((int) $user->is_banned === 1) {
            return response()->json([
                'success' => false,
                'message' => 'You are banned for some illegal or inappropriate behaviours.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'user_type' => $user->user_type,
                'profile_url' => $user->profile_url ?? null,
                'is_banned' => (bool) $user->is_banned,
                'ban_reason' => $user->ban_reason,
            ],
        ]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        $this->ensureBanColumns();

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
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
                'is_banned' => (bool) $user->is_banned,
                'ban_reason' => $user->ban_reason,
            ],
        ]);
    }
}