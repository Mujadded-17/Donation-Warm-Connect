<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class AdminUserController extends Controller
{
    private const ADMIN_EMAIL = 'silviaadmin@gmail.com';

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

    private function isAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        return strtolower((string) $user->user_type) === 'admin'
            || strtolower((string) $user->email) === self::ADMIN_EMAIL;
    }

    private function denyIfNotAdmin(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (!$this->isAdmin($authUser)) {
            return response()->json([
                'success' => false,
                'message' => 'Admin access required',
            ], 403);
        }

        return null;
    }

    public function search(Request $request)
    {
        $this->ensureBanColumns();

        if ($response = $this->denyIfNotAdmin($request)) {
            return $response;
        }

        $query = trim((string) $request->query('query', ''));
        $normalizedQuery = strtolower($query);

        $users = DB::table('user')
            ->select([
                'user_id',
                'name',
                'email',
                'phone',
                'address',
                'user_type',
                'profile_url',
                'is_banned',
                'ban_reason',
                'banned_at',
            ])
            ->whereRaw('LOWER(COALESCE(user_type, "")) <> ?', ['admin'])
            ->whereRaw('LOWER(COALESCE(email, "")) <> ?', [self::ADMIN_EMAIL])
            ->when($query !== '', function ($builder) use ($normalizedQuery) {
                $like = '%' . $normalizedQuery . '%';
                $builder->where(function ($subQuery) use ($like) {
                    $subQuery->whereRaw('LOWER(COALESCE(name, "")) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(email, "")) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(user_type, "")) LIKE ?', [$like]);
                });
            })
            ->orderBy('name')
            ->limit(25)
            ->get()
            ->map(function ($user) {
                return [
                    'user_id' => (int) $user->user_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'user_type' => $user->user_type,
                    'profile_url' => $user->profile_url ?? null,
                    'is_banned' => (bool) $user->is_banned,
                    'ban_reason' => $user->ban_reason,
                    'banned_at' => $user->banned_at,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    public function ban(Request $request, $userId)
    {
        return $this->setBanState($request, (int) $userId, true);
    }

    public function unban(Request $request, $userId)
    {
        return $this->setBanState($request, (int) $userId, false);
    }

    private function setBanState(Request $request, int $userId, bool $shouldBan)
    {
        $this->ensureBanColumns();

        if ($response = $this->denyIfNotAdmin($request)) {
            return $response;
        }

        $target = User::where('user_id', $userId)->first();

        if (!$target) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        if ($this->isAdmin($target)) {
            return response()->json([
                'success' => false,
                'message' => 'Admin accounts cannot be banned',
            ], 400);
        }

        $target->is_banned = $shouldBan ? 1 : 0;
        $target->ban_reason = $shouldBan
            ? trim((string) $request->input('reason', 'You are banned for some illegal or inappropriate behaviours.'))
            : null;
        $target->banned_at = $shouldBan ? now() : null;
        $target->save();

        if ($shouldBan) {
            $target->tokens()->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->where('tokenable_id', $target->user_id)
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $shouldBan ? 'User banned successfully' : 'User unbanned successfully',
            'user' => [
                'user_id' => (int) $target->user_id,
                'name' => $target->name,
                'email' => $target->email,
                'phone' => $target->phone,
                'address' => $target->address,
                'user_type' => $target->user_type,
                'profile_url' => $target->profile_url ?? null,
                'is_banned' => (bool) $target->is_banned,
                'ban_reason' => $target->ban_reason,
                'banned_at' => $target->banned_at,
            ],
        ]);
    }
}