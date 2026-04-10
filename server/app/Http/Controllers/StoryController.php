<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoryController extends Controller
{
    // Get all approved stories (public)
    public function index()
    {
        $stories = DB::table('story as s')
            ->join('user as u', 'u.user_id', '=', 's.user_id')
            ->where('s.status', 'approved')
            ->orderBy('s.created_at', 'desc')
            ->select([
                's.story_id',
                's.user_id',
                's.title',
                's.content',
                's.item_title',
                's.image_url',
                's.likes',
                's.comments',
                's.status',
                's.created_at',
                'u.name as user_name',
                'u.user_type',
                'u.profile_url as user_avatar',
            ])
            ->get();
        
        return response()->json($stories);
    }

    // Create a new story (authenticated)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:user,user_id',
            'title' => 'required|string|max:200',
            'content' => 'required|string',
            'item_title' => 'nullable|string|max:150',
            'image_url' => 'nullable|url|max:255',
        ]);

        // Verify the authenticated user matches the user_id
        if ($request->user()->user_id != $validated['user_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $storyId = DB::table('story')->insertGetId([
            'user_id' => $validated['user_id'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'item_title' => $validated['item_title'] ?? null,
            'image_url' => $validated['image_url'] ?? null,
            'likes' => 0,
            'comments' => 0,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story submitted for approval',
            'story_id' => $storyId,
        ], 201);
    }

    // Like a story (authenticated)
    public function like(Request $request, $storyId)
    {
        $userId = $request->user()->user_id;

        // Check if story exists
        $story = DB::table('story')->where('story_id', $storyId)->first();
        if (!$story) {
            return response()->json([
                'success' => false,
                'message' => 'Story not found',
            ], 404);
        }

        // Check if user already liked this story
        $existingLike = DB::table('story_like')
            ->where('story_id', $storyId)
            ->where('user_id', $userId)
            ->exists();

        if ($existingLike) {
            return response()->json([
                'success' => false,
                'message' => 'You have already liked this story',
            ], 400);
        }

        // Add like
        DB::table('story_like')->insert([
            'story_id' => $storyId,
            'user_id' => $userId,
            'created_at' => now(),
        ]);

        // Increment likes count
        DB::table('story')
            ->where('story_id', $storyId)
            ->increment('likes');

        return response()->json([
            'success' => true,
            'message' => 'Story liked successfully',
        ]);
    }

    // Get pending stories for admin (optional)
    public function getPendingStories(Request $request)
    {
        $user = $request->user();
        
        // Check if user is admin
        if (strtolower($user->user_type) !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $stories = DB::table('story as s')
            ->join('user as u', 'u.user_id', '=', 's.user_id')
            ->where('s.status', 'pending')
            ->orderBy('s.created_at', 'desc')
            ->select([
                's.story_id',
                's.user_id',
                's.title',
                's.content',
                's.item_title',
                's.image_url',
                's.status',
                's.created_at',
                'u.name as user_name',
                'u.email as user_email',
            ])
            ->get();

        return response()->json($stories);
    }

    // Update story status for admin (optional)
    public function updateStoryStatus(Request $request, $storyId)
    {
        $user = $request->user();
        
        // Check if user is admin
        if (strtolower($user->user_type) !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        DB::table('story')
            ->where('story_id', $storyId)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Story status updated successfully',
        ]);
    }
}