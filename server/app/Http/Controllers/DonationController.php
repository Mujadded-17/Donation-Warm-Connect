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
            'message' => $receiver->name . ' (' . $receiver->email . ') requested item "' . $item->title . '".',
            'create_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request sent successfully',
        ], 201);
    }

    public function getIncomingRequests(Request $request, $donorId)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $isAdmin = strtolower((string) $authUser->user_type) === 'admin';
        if ((int) $authUser->user_id !== (int) $donorId && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        $requests = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->join('user as r', 'r.user_id', '=', 'd.receiver_id')
            ->where('d.donor_id', $donorId)
            ->orderBy('d.request_date', 'desc')
            ->select([
                'd.donation_id',
                'd.item_id',
                'd.donor_id',
                'd.receiver_id',
                'd.status as donation_status',
                'd.request_date',
                'i.title as item_title',
                'i.pickup_location',
                'r.name as receiver_name',
                'r.email as receiver_email',
                'r.phone as receiver_phone',
                'r.address as receiver_address',
                'r.profile_url as receiver_profile_url',
            ])
            ->get();

        return response()->json([
            'success' => true,
            'requests' => $requests,
        ]);
    }

    public function decideRequest(Request $request, $donationId)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $authUser = $request->user();
        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $donation = DB::table('donation')->where('donation_id', $donationId)->first();

        if (!$donation) {
            return response()->json([
                'success' => false,
                'message' => 'Donation request not found',
            ], 404);
        }

        $isAdmin = strtolower((string) $authUser->user_type) === 'admin';
        if ((int) $donation->donor_id !== (int) $authUser->user_id && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        DB::table('donation')
            ->where('donation_id', $donationId)
            ->update([
                'status' => $validated['status'],
            ]);

        $item = DB::table('item')->where('item_id', $donation->item_id)->first();

        DB::table('notification')->insert([
            'user_id' => $donation->receiver_id,
            'type' => 'request_' . $validated['status'],
            'message' => 'Your request for item "' . ($item->title ?? 'Item') . '" was ' . $validated['status'] . '.',
            'create_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request ' . $validated['status'] . ' successfully',
        ]);
    }
}