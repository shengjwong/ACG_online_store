<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Redemption extends Model
{
    protected $fillable = [
        'user_id', 'reward_product_id', 'points_spent', 'status', 'redemption_number', 'shipping_status',
        'shipping_address', 'estimated_delivery_start', 'estimated_delivery_end', 'shipped_at', 'delivered_at',
    ];

    protected $casts = [
        'estimated_delivery_start' => 'date',
        'estimated_delivery_end' => 'date',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function product() { return $this->belongsTo(RewardProduct::class, 'reward_product_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
