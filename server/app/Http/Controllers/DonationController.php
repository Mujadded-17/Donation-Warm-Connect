<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    public function requestItem(Request $request)
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:item,item_id'],
            'receiver_id' => ['required', 'integer', 'exists:user,user_id'],
        ]);

        $item = DB::table('item')->where('item_id', $validated['item_id'])->first();
        $receiver = DB::table('user')->where('user_id', $validated['receiver_id'])->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found',
            ], 404);
        }

        if (!$receiver) {
            return response()->json([
                'success' => false,
                'message' => 'Receiver not found',
            ], 404);
        }

        if (strtolower($receiver->user_type) !== 'receiver') {
            return response()->json([
                'success' => false,
                'message' => 'Only receivers can request items',
            ], 403);
        }

        if ((int) $item->donor_id === (int) $receiver->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot request your own item',
            ], 400);
        }

        $alreadyRequested = DB::table('donation')
            ->where('item_id', $item->item_id)
            ->where('receiver_id', $receiver->user_id)
            ->exists();

        if ($alreadyRequested) {
            return response()->json([
                'success' => false,
                'message' => 'You already requested this item',
            ], 409);
        }

        DB::table('donation')->insert([
            'item_id' => $item->item_id,
            'donor_id' => $item->donor_id,
            'receiver_id' => $receiver->user_id,
            'request_date' => now(),
            'status' => 'requested',
        ]);

        DB::table('notification')->insert([
            'user_id' => $item->donor_id,
            'type' => 'item_request',
            'message' => $receiver->name . ' wants to request the item ' . $item->title,
            'create_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request sent successfully',
        ], 201);
    }
}