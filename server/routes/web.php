<?php

use Illuminate\Support\Facades\Route;

require __DIR__ . '/auth.php';

Route::get('{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');