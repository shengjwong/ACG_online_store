<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'transaction_id',
        'payment_method',
        'amount',
        'payment_status',
        'payload_response',
        'paid_at',
    ];

    // Raw PayPal data stays on the server and is never sent to the browser
    protected $hidden = ['payload_response'];

    protected $casts = [
        'paid_at' => 'datetime',
        'payload_response' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
