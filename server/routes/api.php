<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// Public routes
Route::get('/items', [ItemController::class, 'index']);
Route::get('/items/{itemId}/availability', [ItemController::class, 'checkAvailability']); // Add this line
Route::get('/categories', function () {
    $categories = DB::table('category')->get();
    return response()->json($categories);
});

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/me', [AuthenticatedSessionController::class, 'me']);

    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{id}', [ItemController::class, 'update']);
    Route::delete('/items/{id}', [ItemController::class, 'destroy']);

    Route::get('/user/donations/{userId}', [ItemController::class, 'getUserDonations']);

    Route::get('/admin/items/pending', [ItemController::class, 'getPendingItems']);
    Route::put('/admin/items/{id}/status', [ItemController::class, 'updateStatus']);

    Route::get('/profile/{userId}', [ProfileController::class, 'show']);
    Route::put('/profile/{userId}', [ProfileController::class, 'update']);

    // Receiver requests an item
    Route::post('/donations/request', [DonationController::class, 'requestItem']);
    Route::get('/donations/incoming/{donorId}', [DonationController::class, 'getIncomingRequests']);
    Route::put('/donations/{donationId}/decision', [DonationController::class, 'decideRequest']);

    // Donor inbox notifications
    Route::get('/notifications/{userId}', [NotificationController::class, 'getUserNotifications']);

    // Donor-receiver chat
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/messages/{otherUserId}', [ChatController::class, 'getMessages']);
    Route::post('/chat/messages', [ChatController::class, 'sendMessage']);
});