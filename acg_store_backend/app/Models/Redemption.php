<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Redemption extends Model
{
    protected $fillable = ['user_id','reward_product_id','points_spent','status','redemption_number','shipping_status'];
    public function product() { return $this->belongsTo(RewardProduct::class, 'reward_product_id'); }
}
