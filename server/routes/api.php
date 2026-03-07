<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::get('/items', [ItemController::class, 'index']);
Route::post('/items', [ItemController::class, 'store']);
Route::put('/items/{id}', [ItemController::class, 'update']);
Route::delete('/items/{id}', [ItemController::class, 'destroy']);

// User donations routes
Route::get('/user/donations/{userId}', [ItemController::class, 'getUserDonations']);

// Admin routes
Route::get('/admin/items/pending', [ItemController::class, 'getPendingItems']);
Route::put('/admin/items/{id}/status', [ItemController::class, 'updateStatus']);

Route::get('/categories', function () {
    $categories = DB::table('category')->get();
    return response()->json($categories);
});

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);