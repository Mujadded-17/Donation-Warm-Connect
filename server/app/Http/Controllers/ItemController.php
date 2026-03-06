<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function index()
    {
        $items = DB::table('item')->get();
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
}