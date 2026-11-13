<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RewardProduct extends Model
{
    protected $fillable = ['name','description','image','points_required','stock','is_active'];
    protected $casts = ['is_active' => 'boolean', 'points_required' => 'integer', 'stock' => 'integer'];
    public function redemptions() { return $this->hasMany(Redemption::class, 'reward_product_id'); }
}
