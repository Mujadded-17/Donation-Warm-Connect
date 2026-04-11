<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavedItemController extends Controller
{
    // Get all saved items for a user
    public function index($userId)
    {
        $savedItems = DB::table('saved_items as si')
            ->join('item as i', 'i.item_id', '=', 'si.item_id')
            ->join('user as u', 'u.user_id', '=', 'i.donor_id')
            ->where('si.user_id', $userId)
            ->where('i.status', 'approved')
            ->orderBy('si.created_at', 'desc')
            ->select([
                'si.saved_id',
                'si.item_id',
                'si.created_at as saved_at',
                'i.title',
                'i.description',
                'i.images',
                'i.pickup_location',
                'i.delivery_available',
                'i.post_date',
                'i.donor_id',
                'u.name as donor_name',
            ])
            ->get();

        return response()->json($savedItems);
    }

    // Save an item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:user,user_id',
            'item_id' => 'required|exists:item,item_id',
        ]);

        // Check if already saved
        $exists = DB::table('saved_items')
            ->where('user_id', $validated['user_id'])
            ->where('item_id', $validated['item_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Item already saved',
            ], 409);
        }

        // Check if item exists and is approved
        $item = DB::table('item')
            ->where('item_id', $validated['item_id'])
            ->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found',
            ], 404);
        }

        $savedId = DB::table('saved_items')->insertGetId([
            'user_id' => $validated['user_id'],
            'item_id' => $validated['item_id'],
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item saved successfully',
            'saved_id' => $savedId,
        ], 201);
    }

    // Remove a saved item
    public function destroy($itemId)
    {
        $user = request()->user();
        
        $deleted = DB::table('saved_items')
            ->where('user_id', $user->user_id)
            ->where('item_id', $itemId)
            ->delete();

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Item removed from saved',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Saved item not found',
        ], 404);
    }
}