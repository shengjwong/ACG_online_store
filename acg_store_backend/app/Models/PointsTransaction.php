<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PointsTransaction extends Model
{
    protected $fillable = ['user_id','type','points','reference_type','reference_id','description','expires_at'];
    protected $casts = ['expires_at' => 'datetime'];
}
