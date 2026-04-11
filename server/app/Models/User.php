<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'user_id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'pass_hash',
        'phone',
        'address',
        'user_type',
        'profile_url',
        'is_banned',
        'ban_reason',
        'banned_at'
    ];

    protected $hidden = [
        'pass_hash'
    ];

    protected $casts = [
        'is_banned' => 'boolean',
        'banned_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->pass_hash;
    }
}