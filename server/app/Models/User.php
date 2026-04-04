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
        'profile_url'
    ];

    protected $hidden = [
        'pass_hash'
    ];

    public function getAuthPassword()
    {
        return $this->pass_hash;
    }
}