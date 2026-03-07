<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'user';        // your table name
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