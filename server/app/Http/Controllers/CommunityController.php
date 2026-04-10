<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommunityController extends Controller
{
    // Get community statistics
    public function getStats()
    {
        $totalUsers = DB::table('user')->count();
        $totalDonors = DB::table('user')->where('user_type', 'donor')->count();
        $totalReceivers = DB::table('user')->where('user_type', 'receiver')->count();
        
        $totalDonations = DB::table('item')->where('status', 'approved')->count();
        $totalPendingDonations = DB::table('item')->where('status', 'pending')->count();
        
        $totalStories = DB::table('story')->where('status', 'approved')->count();
        $totalLikes = DB::table('story_like')->count();
        
        $fulfilledRequests = DB::table('donation')->where('status', 'approved')->count();
        $livesImpacted = $fulfilledRequests * 3;
        
        $monthlyGoal = 1000;
        $donationsThisMonth = DB::table('item')
            ->where('status', 'approved')
            ->whereMonth('post_date', now()->month)
            ->whereYear('post_date', now()->year)
            ->count();
        
        $progressPercentage = min(100, round(($donationsThisMonth / $monthlyGoal) * 100));
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_donors' => $totalDonors,
                'total_receivers' => $totalReceivers,
                'total_donations' => $totalDonations,
                'total_pending_donations' => $totalPendingDonations,
                'total_stories' => $totalStories,
                'total_likes' => $totalLikes,
                'fulfilled_requests' => $fulfilledRequests,
                'lives_impacted' => $livesImpacted,
                'monthly_goal' => $monthlyGoal,
                'donations_this_month' => $donationsThisMonth,
                'progress_percentage' => $progressPercentage,
            ]
        ]);
    }
    
    // Get top donors leaderboard
    public function getTopDonors()
    {
        $topDonors = DB::table('item as i')
            ->join('user as u', 'u.user_id', '=', 'i.donor_id')
            ->where('i.status', 'approved')
            ->select('u.user_id', 'u.name', 'u.profile_url', DB::raw('COUNT(*) as donation_count'))
            ->groupBy('u.user_id', 'u.name', 'u.profile_url')
            ->orderBy('donation_count', 'desc')
            ->limit(10)
            ->get();
        
        $rank = 1;
        foreach ($topDonors as $donor) {
            $donor->rank = $rank++;
        }
        
        return response()->json([
            'success' => true,
            'data' => $topDonors
        ]);
    }
    
    // Get recent community activity
    public function getRecentActivity()
    {
        $recentDonations = DB::table('item as i')
            ->join('user as u', 'u.user_id', '=', 'i.donor_id')
            ->where('i.status', 'approved')
            ->orderBy('i.post_date', 'desc')
            ->limit(10)
            ->select([
                'i.item_id',
                'i.title',
                'i.post_date',
                'u.name as user_name',
                DB::raw("'donation' as type")
            ])
            ->get();
        
        $recentRequests = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->join('user as u', 'u.user_id', '=', 'd.receiver_id')
            ->where('d.status', 'approved')
            ->orderBy('d.request_date', 'desc')
            ->limit(10)
            ->select([
                'd.donation_id',
                'i.title',
                'd.request_date as post_date',
                'u.name as user_name',
                DB::raw("'request' as type")
            ])
            ->get();
        
        $recentStories = DB::table('story as s')
            ->join('user as u', 'u.user_id', '=', 's.user_id')
            ->where('s.status', 'approved')
            ->orderBy('s.created_at', 'desc')
            ->limit(10)
            ->select([
                's.story_id',
                's.title',
                's.created_at as post_date',
                'u.name as user_name',
                DB::raw("'story' as type")
            ])
            ->get();
        
        $activities = $recentDonations->concat($recentRequests)->concat($recentStories);
        $activities = $activities->sortByDesc('post_date')->take(20)->values();
        
        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }
    
    // Get gratitude wall messages (NO ADMIN APPROVAL NEEDED - shows all)
    public function getGratitudeWall()
    {
        $thankYous = DB::table('gratitude_wall as g')
            ->join('user as u', 'u.user_id', '=', 'g.from_user_id')
            ->leftJoin('user as d', 'd.user_id', '=', 'g.to_user_id')
            ->orderBy('g.created_at', 'desc')
            ->limit(50)
            ->select([
                'g.id',
                'g.message',
                'g.created_at',
                'u.name as from_user_name',
                'u.profile_url as from_user_avatar',
                'd.name as to_user_name',
                'g.item_title',
            ])
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $thankYous
        ]);
    }
    
    // Add thank you message to gratitude wall (NO ADMIN APPROVAL NEEDED)
    public function addThankYou(Request $request)
    {
        $validated = $request->validate([
            'to_user_id' => 'nullable|exists:user,user_id',
            'message' => 'required|string|min:2|max:500',
            'item_title' => 'nullable|string|max:150',
        ]);
        
        $thankYouId = DB::table('gratitude_wall')->insertGetId([
            'from_user_id' => $request->user()->user_id,
            'to_user_id' => $validated['to_user_id'] ?? null,
            'message' => $validated['message'],
            'item_title' => $validated['item_title'] ?? null,
            'status' => 'approved', // Auto-approve, no admin needed
            'created_at' => now(),
        ]);
        
        // Send notification to the donor being thanked
        if ($validated['to_user_id']) {
            DB::table('notification')->insert([
                'user_id' => $validated['to_user_id'],
                'type' => 'thank_you_received',
                'message' => $request->user()->name . ' thanked you for your donation' . ($validated['item_title'] ? ' of "' . $validated['item_title'] . '"' : ''),
                'create_time' => now(),
            ]);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Thank you message posted successfully!',
            'id' => $thankYouId
        ], 201);
    }
    
    // Get user badges
    public function getUserBadges($userId)
    {
        $badges = [];
        
        $donationCount = DB::table('item')
            ->where('donor_id', $userId)
            ->where('status', 'approved')
            ->count();
        
        if ($donationCount >= 10) {
            $badges[] = [
                'id' => 'super_donor',
                'name' => 'Super Donor',
                'icon' => '🦸',
                'description' => 'Made 10+ donations',
                'color' => '#ffd700'
            ];
        } elseif ($donationCount >= 5) {
            $badges[] = [
                'id' => 'generous_donor',
                'name' => 'Generous Donor',
                'icon' => '🌟',
                'description' => 'Made 5+ donations',
                'color' => '#c0c0c0'
            ];
        } elseif ($donationCount >= 1) {
            $badges[] = [
                'id' => 'first_donation',
                'name' => 'First Donation',
                'icon' => '🎁',
                'description' => 'Made first donation',
                'color' => '#cd7f32'
            ];
        }
        
        $topCategory = DB::table('item as i')
            ->join('category as c', 'c.category_id', '=', 'i.category_id')
            ->where('i.donor_id', $userId)
            ->where('i.status', 'approved')
            ->select('c.name', DB::raw('COUNT(*) as count'))
            ->groupBy('c.category_id', 'c.name')
            ->orderBy('count', 'desc')
            ->first();
        
        if ($topCategory && $topCategory->count >= 3) {
            $badges[] = [
                'id' => 'category_champion',
                'name' => "{$topCategory->name} Champion",
                'icon' => '🏆',
                'description' => "Donated {$topCategory->count} items in {$topCategory->name}",
                'color' => '#4caf50'
            ];
        }
        
        $fulfilledCount = DB::table('donation as d')
            ->join('item as i', 'i.item_id', '=', 'd.item_id')
            ->where('i.donor_id', $userId)
            ->where('d.status', 'approved')
            ->count();
        
        if ($fulfilledCount >= 5) {
            $badges[] = [
                'id' => 'community_hero',
                'name' => 'Community Hero',
                'icon' => '🤝',
                'description' => 'Helped 5+ families',
                'color' => '#e91e63'
            ];
        } elseif ($fulfilledCount >= 1) {
            $badges[] = [
                'id' => 'helper',
                'name' => 'Helper',
                'icon' => '💝',
                'description' => 'Successfully helped someone',
                'color' => '#2196f3'
            ];
        }
        
        $monthsDonated = DB::table('item')
            ->where('donor_id', $userId)
            ->where('status', 'approved')
            ->select(DB::raw('DISTINCT DATE_FORMAT(post_date, "%Y-%m") as month'))
            ->get()
            ->count();
        
        if ($monthsDonated >= 3) {
            $badges[] = [
                'id' => 'streak_master',
                'name' => 'Streak Master',
                'icon' => '🔥',
                'description' => 'Donated for 3+ months',
                'color' => '#ff9800'
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $badges
        ]);
    }
}