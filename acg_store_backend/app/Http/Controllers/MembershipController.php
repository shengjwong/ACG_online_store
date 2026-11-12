<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MembershipController extends Controller
{
    public function registerMembership(Request $request) {
        $u = $request->user();
        abort_unless($u->role === 'member', 403, 'Only member accounts can register for membership.');
        if ($u->membership_expiry) {
            return response()->json(['message' => 'You are already registered for membership.'], 409);
        }
        $u->membership_tier = 'Bronze';
        $u->membership_status = 'active';
        $u->membership_expiry = now()->addYear();
        $u->save();
        return response()->json(['status'=>'success','message'=>'Membership registration successful. Welcome, Bronze Member!','data'=>$this->data($u->fresh())], 201);
    }

    public function mine(Request $request) {
        return response()->json(['status'=>'success','data'=>$this->data($request->user())]);
    }
    public function index(Request $request) {
        $this->admin($request);
        return response()->json(['status'=>'success','data'=>User::where('role','member')->latest()->get()->map(fn($u)=>$this->data($u))]);
    }
    public function show(Request $request, $id) {
        $this->admin($request);
        return response()->json(['status'=>'success','data'=>$this->data(User::where('role','member')->findOrFail($id))]);
    }
    public function deactivate(Request $request, $id) {
        $this->admin($request);
        $u=User::where('role','member')->findOrFail($id);
        $u->membership_status='inactive'; $u->save();
        return response()->json(['status'=>'success','message'=>'Membership deactivated successfully.','data'=>$this->data($u->fresh())]);
    }
    public function renew(Request $request) {
        $u=$request->user();
        abort_unless($u->role==='member',403,'Only members can renew membership.');
        $this->renewOne($u);
        return response()->json(['status'=>'success','message'=>'Membership renewed for one year.','data'=>$this->data($u->fresh())]);
    }
    public function adminRenew(Request $request, $id) {
        $this->admin($request);
        $u=User::where('role','member')->findOrFail($id);
        $this->renewOne($u);
        return response()->json(['status'=>'success','message'=>'Member renewed for one year.','data'=>$this->data($u->fresh())]);
    }
    private function renewOne(User $u): void {
        $expiry=$u->membership_expiry ? Carbon::parse($u->membership_expiry) : null;
        $base=($u->membership_status==='active' && $expiry && $expiry->isFuture()) ? $expiry : now();
        $u->membership_status='active';
        $u->membership_expiry=$base->copy()->addYear();
        if (!$u->membership_tier || $u->membership_tier==='Normal') $u->membership_tier='Bronze';
        $u->save();
    }
    private function admin(Request $r): void { abort_unless($r->user() && $r->user()->role==='admin',403,'Admin access only.'); }
    private function data(User $u): array {
        $expiry=$u->membership_expiry ? Carbon::parse($u->membership_expiry) : null;
        $status=$u->membership_status ?? 'active';
        if ($status==='active' && $expiry && $expiry->isPast()) $status='expired';
        return ['id'=>$u->id,'name'=>$u->name,'email'=>$u->email,'phone_number'=>$u->phone_number,'profile_image'=>$u->profile_image,'role'=>$u->role,'membership_tier'=>$u->membership_tier ?? 'Normal','membership_status'=>$status,'membership_expiry'=>$u->membership_expiry,'created_at'=>$u->created_at];
    }
}
