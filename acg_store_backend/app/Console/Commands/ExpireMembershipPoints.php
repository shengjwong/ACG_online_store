<?php
namespace App\Console\Commands;

use App\Models\PointsTransaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireMembershipPoints extends Command
{
    protected $signature = 'membership:expire-points';
    protected $description = 'Expire unused loyalty points three months after membership expiry';

    public function handle(): int
    {
        User::whereNotNull('membership_expiry')->where('membership_expiry', '<=', now()->subMonths(3))
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    DB::transaction(function () use ($user) {
                        $locked = User::whereKey($user->id)->lockForUpdate()->first();
                        if (!$locked || (int)$locked->points_balance <= 0) return;
                        $balance = (int)$locked->points_balance;
                        $locked->points_balance = 0;
                        $locked->save();
                        PointsTransaction::create([
                            'user_id' => $locked->id, 'type' => 'expired', 'points' => -$balance,
                            'reference_type' => 'membership_expiry',
                            'reference_id' => (string)$locked->membership_expiry,
                            'description' => 'Unused points expired after the 3-month membership grace period.',
                        ]);
                    });
                }
            });
        $this->info('Expired membership points processed.');
        return self::SUCCESS;
    }
}
