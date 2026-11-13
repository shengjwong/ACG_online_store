<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'processed_by_admin_id',
        'subtotal',
        'shipping_fee',
        'total_amount',
        'shipping_address',
        'tracking_number',
        'courier_name',
        'order_status',
        'cancel_reason',
        'estimated_delivery_start',
        'estimated_delivery_end',
        'shipped_at',
        'delivered_at',
        'completed_at',
    ];

    protected $casts = [
        'estimated_delivery_start' => 'date',
        'estimated_delivery_end' => 'date',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}