<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $userId = (int) $authUser->user_id;

        $messages = DB::table('chat_message as cm')
            ->where(function ($q) use ($userId) {
                $q->where('cm.sender_id', $userId)
                    ->orWhere('cm.receiver_id', $userId);
            })
            ->orderBy('cm.create_time', 'desc')
            ->get();

        $partnerIds = [];
        foreach ($messages as $message) {
            $partnerId = (int) $message->sender_id === $userId
                ? (int) $message->receiver_id
                : (int) $message->sender_id;

            if (!isset($partnerIds[$partnerId])) {
                $partnerIds[$partnerId] = true;
            }
        }

        if (count($partnerIds) === 0) {
            return response()->json([
                'success' => true,
                'conversations' => [],
            ]);
        }

        $users = DB::table('user')
            ->whereIn('user_id', array_keys($partnerIds))
            ->select(['user_id', 'name', 'email', 'profile_url', 'user_type'])
            ->get()
            ->keyBy('user_id');

        $conversations = [];
        foreach ($messages as $message) {
            $partnerId = (int) $message->sender_id === $userId
                ? (int) $message->receiver_id
                : (int) $message->sender_id;

            if (isset($conversations[$partnerId])) {
                continue;
            }

            if (!$users->has($partnerId)) {
                continue;
            }

            $partner = $users[$partnerId];

            $conversations[$partnerId] = [
                'user_id' => (int) $partner->user_id,
                'name' => $partner->name,
                'email' => $partner->email,
                'profile_url' => $partner->profile_url,
                'user_type' => $partner->user_type,
                'last_message' => $message->message,
                'last_message_time' => $message->create_time,
                'last_sender_id' => (int) $message->sender_id,
            ];
        }

        return response()->json([
            'success' => true,
            'conversations' => array_values($conversations),
        ]);
    }

    public function getMessages(Request $request, $otherUserId)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $userId = (int) $authUser->user_id;
        $peerId = (int) $otherUserId;

        if ($userId === $peerId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid conversation user',
            ], 400);
        }

        if (!$this->canUsersChat($userId, $peerId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not allowed to chat with this user',
            ], 403);
        }

        $messages = DB::table('chat_message')
            ->where(function ($q) use ($userId, $peerId) {
                $q->where('sender_id', $userId)
                    ->where('receiver_id', $peerId);
            })
            ->orWhere(function ($q) use ($userId, $peerId) {
                $q->where('sender_id', $peerId)
                    ->where('receiver_id', $userId);
            })
            ->orderBy('create_time', 'asc')
            ->limit(250)
            ->get();

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $validated = $request->validate([
            'receiver_id' => ['required', 'integer', 'exists:user,user_id'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $senderId = (int) $authUser->user_id;
        $receiverId = (int) $validated['receiver_id'];

        if ($senderId === $receiverId) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot message yourself',
            ], 400);
        }

        if (!$this->canUsersChat($senderId, $receiverId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not allowed to chat with this user',
            ], 403);
        }

        $chatId = DB::table('chat_message')->insertGetId([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'message' => trim($validated['message']),
            'create_time' => now(),
        ]);

        $message = DB::table('chat_message')->where('chat_id', $chatId)->first();

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'chat' => $message,
        ], 201);
    }

    private function canUsersChat(int $firstUserId, int $secondUserId): bool
    {
        return DB::table('donation')
            ->where(function ($q) use ($firstUserId, $secondUserId) {
                $q->where('donor_id', $firstUserId)
                    ->where('receiver_id', $secondUserId);
            })
            ->orWhere(function ($q) use ($firstUserId, $secondUserId) {
                $q->where('donor_id', $secondUserId)
                    ->where('receiver_id', $firstUserId);
            })
            ->exists();
    }
}
