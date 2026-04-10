<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// Public routes
Route::get('/items', [ItemController::class, 'index']);
Route::get('/items/{itemId}/availability', [ItemController::class, 'checkAvailability']);
Route::get('/categories', function () {
    $categories = DB::table('category')->get();
    return response()->json($categories);
});

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Public story routes (anyone can view stories)
Route::get('/stories', [StoryController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/me', [AuthenticatedSessionController::class, 'me']);

    // Item routes
    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{id}', [ItemController::class, 'update']);
    Route::delete('/items/{id}', [ItemController::class, 'destroy']);

    Route::get('/user/donations/{userId}', [ItemController::class, 'getUserDonations']);

    // Admin routes
    Route::get('/admin/items/pending', [ItemController::class, 'getPendingItems']);
    Route::put('/admin/items/{id}/status', [ItemController::class, 'updateStatus']);

    // Profile routes
    Route::get('/profile/{userId}', [ProfileController::class, 'show']);
    Route::put('/profile/{userId}', [ProfileController::class, 'update']);

    // Donation routes
    Route::post('/donations/request', [DonationController::class, 'requestItem']);
    Route::get('/donations/incoming/{donorId}', [DonationController::class, 'getIncomingRequests']);
    Route::put('/donations/{donationId}/decision', [DonationController::class, 'decideRequest']);

    // Notification routes
    Route::get('/notifications/{userId}', [NotificationController::class, 'getUserNotifications']);

    // Chat routes
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/messages/{otherUserId}', [ChatController::class, 'getMessages']);
    Route::post('/chat/messages', [ChatController::class, 'sendMessage']);

    // Story routes (authenticated users can create and like stories)
    Route::post('/stories', [StoryController::class, 'store']);
    Route::post('/stories/{storyId}/like', [StoryController::class, 'like']);
    
    // Admin story routes (optional - for approving stories)
    Route::get('/admin/stories/pending', [StoryController::class, 'getPendingStories']);
    Route::put('/admin/stories/{storyId}/status', [StoryController::class, 'updateStoryStatus']);
});