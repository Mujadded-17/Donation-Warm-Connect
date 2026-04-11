<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class DonationController extends Controller
{
    private function ensureChatMessageTable(): void
    {
        if (Schema::hasTable('chat_message')) {
            return;
        }

        Schema::create('chat_message', function (Blueprint $table) {
            $table->increments('chat_id');
            $table->unsignedInteger('sender_id');
            $table->unsignedInteger('receiver_id');
            $table->text('message');
            $table->dateTime('create_time')->useCurrent();

            $table->index('sender_id', 'idx_chat_message_sender');
            $table->index('receiver_id', 'idx_chat_message_receiver');
            $table->index('create_time', 'idx_chat_message_time');

            $table->foreign('sender_id', 'fk_chat_message_sender')
                ->references('user_id')
                ->on('user')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('receiver_id', 'fk_chat_message_receiver')
                ->references('user_id')
                ->on('user')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    // Receiver requests an item
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

        // Check if item already has an approved request
        $hasApprovedRequest = DB::table('donation')
            ->where('item_id', $item->item_id)
            ->where('status', 'approved')
            ->exists();

        if ($hasApprovedRequest) {
            return response()->json([
                'success' => false,
                'message' => 'This item is no longer available',
            ], 409);
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

        $this->ensureChatMessageTable();

        DB::table('chat_message')->insert([
            'sender_id' => $receiver->user_id,
            'receiver_id' => $item->donor_id,
            'message' => 'Hi, I requested your item "' . $item->title . '". Please let me know next steps.',
            'create_time' => now(),
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

    // Get incoming requests for a donor
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

    // Donor decides on a request (approve/reject)
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

        // If approving, check if item already has another approved request
        if ($validated['status'] === 'approved') {
            $existingApproved = DB::table('donation')
                ->where('item_id', $donation->item_id)
                ->where('status', 'approved')
                ->where('donation_id', '!=', $donationId)
                ->exists();

            if ($existingApproved) {
                return response()->json([
                    'success' => false,
                    'message' => 'This item already has an approved request',
                ], 409);
            }
        }

        // Update the donation status
        DB::table('donation')
            ->where('donation_id', $donationId)
            ->update([
                'status' => $validated['status'],
            ]);

        $item = DB::table('item')->where('item_id', $donation->item_id)->first();

        // Send notification to receiver
        DB::table('notification')->insert([
            'user_id' => $donation->receiver_id,
            'type' => 'request_' . $validated['status'],
            'message' => 'Your request for item "' . ($item->title ?? 'Item') . '" was ' . $validated['status'] . '.',
            'create_time' => now(),
        ]);

        // Send chat message if approved
        if ($validated['status'] === 'approved') {
            $this->ensureChatMessageTable();
            
            DB::table('chat_message')->insert([
                'sender_id' => $authUser->user_id,
                'receiver_id' => $donation->receiver_id,
                'message' => 'Your request for "' . ($item->title ?? 'Item') . '" has been approved! Please coordinate pickup at: ' . ($item->pickup_location ?? 'location to be confirmed'),
                'create_time' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Request ' . $validated['status'] . ' successfully',
        ]);
    }

    // ========== RECEIVER REQUESTS METHODS ==========

    // Get receiver's requests (for receiver dashboard - My Requests)
    public function getReceiverRequests($userId)
    {
        $requests = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->join('user as u', 'u.user_id', '=', 'i.donor_id')
            ->where('d.receiver_id', $userId)
            ->orderBy('d.request_date', 'desc')
            ->select([
                'd.donation_id',
                'd.item_id',
                'd.status as donation_status',
                'd.request_date',
                'i.title',
                'i.description',
                'i.images',
                'i.pickup_location',
                'u.name as donor_name',
                'u.user_id as donor_id',
            ])
            ->get();

        return response()->json([
            'success' => true,
            'requests' => $requests
        ]);
    }

    // Cancel a request (receiver cancels before donor responds)
    public function cancelRequest($donationId)
    {
        $donation = DB::table('donation')->where('donation_id', $donationId)->first();
        
        if (!$donation) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }
        
        // Only allow cancellation if status is still 'requested'
        if ($donation->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel this request as it has already been ' . $donation->status
            ], 400);
        }
        
        DB::table('donation')->where('donation_id', $donationId)->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Request cancelled successfully'
        ]);
    }

    // ========== ADMIN METHODS ==========

    // Get all donations (for admin)
    public function getAllDonations()
    {
        $donations = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->join('user as donor', 'donor.user_id', '=', 'd.donor_id')
            ->join('user as receiver', 'receiver.user_id', '=', 'd.receiver_id')
            ->orderBy('d.request_date', 'desc')
            ->select([
                'd.donation_id',
                'd.item_id',
                'd.status',
                'd.request_date',
                'i.title as item_title',
                'donor.name as donor_name',
                'donor.email as donor_email',
                'receiver.name as receiver_name',
                'receiver.email as receiver_email',
            ])
            ->get();

        return response()->json([
            'success' => true,
            'donations' => $donations
        ]);
    }

    // Get single donation details
    public function getDonation($donationId)
    {
        $donation = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->join('user as donor', 'donor.user_id', '=', 'd.donor_id')
            ->join('user as receiver', 'receiver.user_id', '=', 'd.receiver_id')
            ->where('d.donation_id', $donationId)
            ->select([
                'd.donation_id',
                'd.item_id',
                'd.status',
                'd.request_date',
                'i.title as item_title',
                'i.description as item_description',
                'i.pickup_location',
                'donor.name as donor_name',
                'donor.email as donor_email',
                'donor.phone as donor_phone',
                'receiver.name as receiver_name',
                'receiver.email as receiver_email',
                'receiver.phone as receiver_phone',
            ])
            ->first();

        if (!$donation) {
            return response()->json([
                'success' => false,
                'message' => 'Donation not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'donation' => $donation
        ]);
    }
}