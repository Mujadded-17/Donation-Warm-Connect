<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function getUserNotifications($userId)
    {
        $notifications = DB::table('notification')
            ->where('user_id', $userId)
            ->orderBy('create_time', 'desc')
            ->get();

        return response()->json($notifications);
    }
}