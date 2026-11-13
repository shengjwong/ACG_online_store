<?php
namespace App\Http\Controllers;

use App\Models\RewardProduct;
use App\Models\Redemption;
use App\Models\PointsTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RewardsController extends Controller
{
    public function index(Request $request) {
        abort_unless($request->user() && $request->user()->role==='member',403,'Member access only.');
        return response()->json(['status'=>'success','data'=>RewardProduct::where('is_active', true)->where('stock','>',0)->latest()->get()]);
    }
    public function adminIndex(Request $request) {
        $this->admin($request);
        return response()->json(['status'=>'success','data'=>RewardProduct::latest()->get()]);
    }
    public function store(Request $request) {
        $this->admin($request);
        $data=$request->validate(['name'=>'required|string|max:255','description'=>'nullable|string','image'=>'nullable|string|max:2048','photo'=>'nullable|image|mimes:jpg,jpeg,png,webp|max:4096','points_required'=>'required|integer|min:1','stock'=>'required|integer|min:0','is_active'=>'sometimes|boolean']);
        unset($data['photo']);
        if ($request->hasFile('photo')) $data['image']=$request->file('photo')->store('rewards','public');
        return response()->json(['status'=>'success','data'=>RewardProduct::create($data)],201);
    }
    public function update(Request $request, RewardProduct $rewardProduct) {
        $this->admin($request);
        $data=$request->validate(['name'=>'sometimes|required|string|max:255','description'=>'nullable|string','image'=>'nullable|string|max:2048','photo'=>'nullable|image|mimes:jpg,jpeg,png,webp|max:4096','points_required'=>'sometimes|required|integer|min:1','stock'=>'sometimes|required|integer|min:0','is_active'=>'sometimes|boolean']);
        unset($data['photo']);
        if ($request->hasFile('photo')) $data['image']=$request->file('photo')->store('rewards','public');
        $rewardProduct->update($data);
        return response()->json(['status'=>'success','data'=>$rewardProduct->fresh()]);
    }
    public function destroy(Request $request, RewardProduct $rewardProduct) {
        $this->admin($request);
        abort_if($rewardProduct->redemptions()->exists(),409,'This reward has redemption history and cannot be deleted. Deactivate it instead.');
        $rewardProduct->delete();
        return response()->json(['status'=>'success','message'=>'Reward deleted.']);
    }
    public function redeem(Request $request, RewardProduct $rewardProduct) {
        $user=$request->user();
        abort_unless($user->role==='member',403);
        $result=DB::transaction(function() use($user,$rewardProduct) {
            $u=User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $p=RewardProduct::whereKey($rewardProduct->id)->lockForUpdate()->firstOrFail();
            abort_unless($p->is_active && $p->stock>0,422,'Reward is unavailable.');
            abort_if((int)$u->points_balance < (int)$p->points_required,422,'Not enough points.');
            $u->points_balance-=(int)$p->points_required; $u->save();
            $p->decrement('stock');
            $r=Redemption::create(['user_id'=>$u->id,'reward_product_id'=>$p->id,'points_spent'=>$p->points_required,'status'=>'processing','shipping_status'=>'pending','redemption_number'=>'RDM-'.strtoupper(Str::random(10))]);
            PointsTransaction::create(['user_id'=>$u->id,'type'=>'redemption','points'=>-(int)$p->points_required,'reference_type'=>'redemption','reference_id'=>(string)$r->id,'description'=>'Redeemed '.$p->name]);
            return $r->load('product');
        });
        return response()->json(['status'=>'success','message'=>'Reward redeemed. Shipping is free.','data'=>$result],201);
    }
    public function myRedemptions(Request $request) {
        return response()->json(['status'=>'success','data'=>Redemption::with('product')->where('user_id',$request->user()->id)->latest()->get()]);
    }
    public function points(Request $request) {
        abort_unless($request->user() && $request->user()->role==='member',403,'Member access only.');
        $u=$request->user();
        return response()->json(['status'=>'success','data'=>['balance'=>(int)$u->points_balance,'transactions'=>PointsTransaction::where('user_id',$u->id)->latest()->get()]]);
    }
    public function adminRedemptions(Request $request) {
        $this->admin($request);
        return response()->json(['status'=>'success','data'=>Redemption::with(['product'])->latest()->get()]);
    }
    private function admin(Request $r): void { abort_unless($r->user() && $r->user()->role==='admin',403,'Admin access only.'); }
}
