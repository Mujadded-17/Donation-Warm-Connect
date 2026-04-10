<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function index()
    {
        // Only show approved items that don't have an approved donation request
        $items = DB::table('item')
            ->where('status', 'approved')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('donation')
                    ->whereColumn('donation.item_id', 'item.item_id')
                    ->where('donation.status', 'approved');
            })
            ->orderBy('post_date', 'desc')
            ->get();
        
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $id = DB::table('item')->insertGetId([
            'title' => $request->title,
            'description' => $request->description,
            'images' => $request->images,
            'status' => $request->status ?? 'pending',
            'delivery_available' => $request->delivery_available ?? 0,
            'pickup_location' => $request->pickup_location,
            'donor_id' => $request->donor_id,
            'category_id' => $request->category_id,
            'post_date' => now(),
        ]);

        return response()->json([
            'message' => 'Item created successfully',
            'item_id' => $id
        ], 201);
    }

    public function update(Request $request, $id)
    {
        DB::table('item')
            ->where('item_id', $id)
            ->update([
                'title' => $request->title,
                'description' => $request->description,
                'images' => $request->images,
                'status' => $request->status,
                'delivery_available' => $request->delivery_available,
                'pickup_location' => $request->pickup_location,
                'category_id' => $request->category_id,
            ]);

        return response()->json([
            'message' => 'Item updated successfully'
        ]);
    }

    public function destroy($id)
    {
        DB::table('item')->where('item_id', $id)->delete();

        return response()->json([
            'message' => 'Item deleted successfully'
        ]);
    }

    // Get user's donations
    public function getUserDonations($userId)
    {
        $items = DB::table('item')
            ->where('donor_id', $userId)
            ->orderBy('post_date', 'desc')
            ->get();
        
        return response()->json($items);
    }

    // Get all pending items (for admin)
    public function getPendingItems()
    {
        $items = DB::table('item')
            ->orderBy('post_date', 'desc')
            ->get();
        
        return response()->json($items);
    }

    // Update item status (for admin)
    public function updateStatus(Request $request, $id)
    {
        DB::table('item')
            ->where('item_id', $id)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status updated successfully',
            'status' => $request->status
        ]);
    }

    // Check if an item is available for request
    public function checkAvailability($itemId)
    {
        $item = DB::table('item')
            ->where('item_id', $itemId)
            ->where('status', 'approved')
            ->first();
        
        if (!$item) {
            return response()->json([
                'available' => false,
                'message' => 'Item not found or not approved'
            ], 404);
        }
        
        $hasApprovedRequest = DB::table('donation')
            ->where('item_id', $itemId)
            ->where('status', 'approved')
            ->exists();
        
        return response()->json([
            'available' => !$hasApprovedRequest,
            'item' => $item
        ]);
    }
}