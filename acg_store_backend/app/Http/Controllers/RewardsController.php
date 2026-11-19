<?php
namespace App\Http\Controllers;

use App\Mail\RedemptionConfirmationMail;
use App\Models\RewardProduct;
use App\Models\Redemption;
use App\Models\PointsTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

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
        $validated=$request->validate(['shipping_address'=>'required|string|min:10|max:2000']);
        $result=DB::transaction(function() use($user,$rewardProduct,$validated) {
            $u=User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $p=RewardProduct::whereKey($rewardProduct->id)->lockForUpdate()->firstOrFail();
            abort_unless($p->is_active && $p->stock>0,422,'Reward is unavailable.');
            abort_if((int)$u->points_balance < (int)$p->points_required,422,'Not enough points.');
            $u->points_balance-=(int)$p->points_required; $u->save();
            $p->decrement('stock');
            $r=Redemption::create(['user_id'=>$u->id,'reward_product_id'=>$p->id,'points_spent'=>$p->points_required,'status'=>'processing','shipping_status'=>'pending','redemption_number'=>'RDM-'.strtoupper(Str::random(10)),'shipping_address'=>$validated['shipping_address'],'estimated_delivery_start'=>now()->addDay()->toDateString(),'estimated_delivery_end'=>now()->addDays(3)->toDateString()]);
            PointsTransaction::create(['user_id'=>$u->id,'type'=>'redemption','points'=>-(int)$p->points_required,'reference_type'=>'redemption','reference_id'=>(string)$r->id,'description'=>'Redeemed '.$p->name]);
            return $r->load('product');
        });
        // Email notification. A mail failure must never undo a completed redemption.
        try {
            $member=User::findOrFail($user->id);
            Mail::to($member->email)->send(new RedemptionConfirmationMail($result,$member));
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json(['status'=>'success','message'=>'Reward redeemed. Shipping is free. A confirmation has been sent to your email and you can track it in My Orders.','data'=>$result],201);
    }
    public function myRedemptions(Request $request) {
        return response()->json(['status'=>'success','data'=>Redemption::with('product')->where('user_id',$request->user()->id)->latest()->get()]);
    }
    public function points(Request $request) {
        abort_unless($request->user() && $request->user()->role==='member',403,'Member access only.');
        $u=$request->user();
        return response()->json(['status'=>'success','data'=>['balance'=>(int)$u->points_balance,'transactions'=>PointsTransaction::where('user_id',$u->id)->latest()->get()]]);
    }
    public function updateMyRedemptionAddress(Request $request, Redemption $redemption) {
        abort_unless($redemption->user_id===$request->user()->id,403,'This redemption is not yours.');
        if (in_array($redemption->status,['shipped','delivered','completed'],true)) {
            return response()->json(['status'=>'error','message'=>'The delivery address can no longer be changed after shipping.'],422);
        }
        $validated=$request->validate(['shipping_address'=>'required|string|min:10|max:2000']);
        $redemption->update($validated);
        return response()->json(['status'=>'success','message'=>'Delivery address updated.','data'=>$redemption->fresh()->load('product')]);
    }
    public function adminRedemptions(Request $request) {
        $this->admin($request);
        return response()->json(['status'=>'success','data'=>Redemption::with(['product','user:id,name,email'])->latest()->get()]);
    }
    /** Admin updates shipping progress and estimated delivery dates, same as product orders. */
    public function adminUpdateRedemption(Request $request, Redemption $redemption) {
        $this->admin($request);
        $validated=$request->validate([
            'status'=>['required',Rule::in(['processing','shipped','delivered'])],
            'estimated_delivery_start'=>'required|date',
            'estimated_delivery_end'=>'required|date|after_or_equal:estimated_delivery_start',
        ]);
        if ($redemption->status==='completed') {
            return response()->json(['status'=>'error','message'=>'Completed redemptions cannot be changed.'],422);
        }
        $changes=$validated;
        if ($validated['status']==='shipped' && !$redemption->shipped_at) $changes['shipped_at']=now();
        if ($validated['status']==='delivered') $changes['delivered_at']=$redemption->delivered_at ?? now();
        $changes['shipping_status']=$validated['status'];
        $redemption->update($changes);
        return response()->json(['status'=>'success','message'=>'Redemption updated.','data'=>$redemption->fresh()->load(['product','user:id,name,email'])]);
    }
    private function admin(Request $r): void { abort_unless($r->user() && $r->user()->role==='admin',403,'Admin access only.'); }
}
