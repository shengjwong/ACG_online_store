<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <--- 1. IMPORT THIS

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes; // <--- 2. USE IT HERE

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'profile_image',
        'membership_tier',
        'membership_expiry',
        'membership_status',
        'membership_registered_at',
        'total_spend',
        'points_balance',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'membership_expiry' => 'datetime',
            'membership_registered_at' => 'datetime',
            'total_spend' => 'decimal:2',
            'points_balance' => 'integer',
        ];
    }
}