<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class CheckBannedUser
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

    public function handle(Request $request, Closure $next)
    {
        $this->ensureBanColumns();

        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $isAdmin = strtolower((string) $user->user_type) === 'admin'
            || strtolower((string) $user->email) === 'silviaadmin@gmail.com';

        if (!$isAdmin && (int) $user->is_banned === 1) {
            return response()->json([
                'success' => false,
                'message' => 'You are banned for some illegal or inappropriate behaviours.',
            ], 403);
        }

        return $next($request);
    }
}