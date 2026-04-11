<?php

namespace App\Http\Controllers;

use App\Mail\DonationPendingMail;
use App\Mail\DonationApprovedMail;
use App\Mail\DonationRejectedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ItemController extends Controller
{
    public function index()
    {
        // Only show approved items that don't have an approved donation request
        $items = DB::table('item')
            ->join('user as u', 'u.user_id', '=', 'item.donor_id')
            ->where('item.status', 'approved')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('donation')
                    ->whereColumn('donation.item_id', 'item.item_id')
                    ->where('donation.status', 'approved');
            })
            ->select('item.*', 'u.name as donor_name')
            ->orderBy('post_date', 'desc')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'images' => ['nullable', 'string'],
            'pickup_location' => ['required', 'string', 'max:255'],
            'delivery_available' => ['nullable', 'boolean'],
            'category_id' => ['required', 'integer', 'exists:category,category_id'],
            'status' => ['nullable', 'in:pending,approved,rejected,completed'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        $id = DB::table('item')->insertGetId([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'images' => $validated['images'] ?? '',
            'status' => $validated['status'] ?? 'pending',
            'delivery_available' => $validated['delivery_available'] ?? 0,
            'pickup_location' => $validated['pickup_location'],
            'donor_id' => $user->user_id,
            'category_id' => $validated['category_id'],
            'post_date' => now(),
        ]);

        $item = DB::table('item')->where('item_id', $id)->first();

        try {
            Mail::to($user->email)->send(new DonationPendingMail($user, $item));
        } catch (\Throwable $e) {
            \Log::error('Donation pending email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Item created successfully. A confirmation email has been sent.',
            'item_id' => $id,
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
    $status = $request->status;

    // update item
    DB::table('item')
        ->where('item_id', $id)
        ->update(['status' => $status]);

    // get item
    $item = DB::table('item')->where('item_id', $id)->first();

    // get donor
    $user = DB::table('user')->where('user_id', $item->donor_id)->first();

    try {
        if ($status === 'approved') {
            Mail::to($user->email)
                ->send(new DonationApprovedMail($user, $item));
        }

        if ($status === 'rejected') {
            Mail::to($user->email)
                ->send(new DonationRejectedMail($user, $item));
        }
    } catch (\Throwable $e) {
        \Log::error('Status email failed: ' . $e->getMessage());
    }

    return response()->json([
        'message' => 'Status updated successfully',
        'status' => $status
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

    // Get donor impact statistics
    public function getDonorImpact($donorId)
    {
        // Get total donations
        $totalDonations = DB::table('item')
            ->where('donor_id', $donorId)
            ->count();

        // Get pending donations
        $pendingDonations = DB::table('item')
            ->where('donor_id', $donorId)
            ->where('status', 'pending')
            ->count();

        // Get approved donations (include 'completed' as well)
        $approvedDonations = DB::table('item')
            ->where('donor_id', $donorId)
            ->whereIn('status', ['approved', 'completed'])
            ->count();

        // Get rejected donations
        $rejectedDonations = DB::table('item')
            ->where('donor_id', $donorId)
            ->where('status', 'rejected')
            ->count();

        // Get fulfilled requests (include 'approved' and 'completed')
        $fulfilledRequests = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->where('i.donor_id', $donorId)
            ->whereIn('d.status', ['approved', 'completed'])
            ->count();

        // Get pending requests (waiting for donor approval)
        $pendingRequests = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->where('i.donor_id', $donorId)
            ->where('d.status', 'requested')
            ->count();

        // Get categories breakdown (include 'approved' and 'completed')
        $categories = DB::table('item as i')
            ->join('category as c', 'c.category_id', '=', 'i.category_id')
            ->where('i.donor_id', $donorId)
            ->whereIn('i.status', ['approved', 'completed'])
            ->select('c.name', DB::raw('COUNT(*) as count'))
            ->groupBy('c.category_id', 'c.name')
            ->get();

        // Get recent approved donations (last 30 days) (include 'completed')
        $recentDonations = DB::table('item')
            ->where('donor_id', $donorId)
            ->whereIn('status', ['approved', 'completed'])
            ->where('post_date', '>=', now()->subDays(30))
            ->count();

        // Calculate estimated lives impacted (each fulfilled request impacts ~3 people)
        $livesImpacted = $fulfilledRequests * 2;

        // Get top category
        $topCategory = DB::table('item as i')
            ->join('category as c', 'c.category_id', '=', 'i.category_id')
            ->where('i.donor_id', $donorId)
            ->whereIn('i.status', ['approved', 'completed'])
            ->select('c.name', DB::raw('COUNT(*) as count'))
            ->groupBy('c.category_id', 'c.name')
            ->orderBy('count', 'desc')
            ->first();

        // Get success rate
        $successRate = $totalDonations > 0 ? round(($approvedDonations / $totalDonations) * 100) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_donations' => $totalDonations,
                'pending_donations' => $pendingDonations,
                'approved_donations' => $approvedDonations,
                'rejected_donations' => $rejectedDonations,
                'fulfilled_requests' => $fulfilledRequests,
                'pending_requests' => $pendingRequests,
                'recent_donations' => $recentDonations,
                'lives_impacted' => $livesImpacted,
                'success_rate' => $successRate,
                'top_category' => $topCategory ? $topCategory->name : 'N/A',
                'categories' => $categories,
            ]
        ]);
    }
}