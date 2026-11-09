<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_image',
        'phone_number',
        'membership_tier',
        'membership_status',
        'membership_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'membership_expires_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}