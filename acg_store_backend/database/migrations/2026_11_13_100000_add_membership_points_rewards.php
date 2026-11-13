<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'membership_registered_at')) $table->timestamp('membership_registered_at')->nullable();
            if (!Schema::hasColumn('users', 'total_spend')) $table->decimal('total_spend', 12, 2)->default(0);
            if (!Schema::hasColumn('users', 'points_balance')) $table->unsignedBigInteger('points_balance')->default(0);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY membership_status ENUM('active','inactive') NOT NULL DEFAULT 'inactive'");
        }

        // Existing users who already had a membership expiry have already used their free registration.
        DB::table('users')->whereNotNull('membership_expiry')->whereNull('membership_registered_at')
            ->update(['membership_registered_at' => DB::raw('COALESCE(membership_expiry, created_at)')]);

        // The original enum did not include Platinum and Diamond.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY membership_tier VARCHAR(30) NOT NULL DEFAULT 'Normal'");
        }

        if (!Schema::hasTable('points_transactions')) {
            Schema::create('points_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('type', 30); // earned, refund, redemption, expired, adjustment
                $table->integer('points');
                $table->string('reference_type')->nullable();
                $table->string('reference_id')->nullable();
                $table->string('description')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'expires_at']);
            });
        }

        if (!Schema::hasTable('reward_products')) {
            Schema::create('reward_products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->unsignedInteger('points_required');
                $table->unsignedInteger('stock')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('redemptions')) {
            Schema::create('redemptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('reward_product_id')->constrained('reward_products')->restrictOnDelete();
                $table->unsignedInteger('points_spent');
                $table->string('status', 30)->default('processing');
                $table->string('redemption_number')->unique();
                $table->string('shipping_status', 30)->default('pending');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('redemptions');
        Schema::dropIfExists('reward_products');
        Schema::dropIfExists('points_transactions');
        Schema::table('users', function (Blueprint $table) {
            foreach (['membership_registered_at', 'total_spend', 'points_balance'] as $column) {
                if (Schema::hasColumn('users', $column)) $table->dropColumn($column);
            }
        });
    }
};
