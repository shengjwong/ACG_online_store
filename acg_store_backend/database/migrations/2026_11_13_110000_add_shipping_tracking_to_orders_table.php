<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_status')->default('pending')->change();
            $table->date('estimated_delivery_start')->nullable()->after('tracking_number');
            $table->date('estimated_delivery_end')->nullable()->after('estimated_delivery_start');
            $table->timestamp('shipped_at')->nullable()->after('estimated_delivery_end');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
            $table->timestamp('completed_at')->nullable()->after('delivered_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'estimated_delivery_start', 'estimated_delivery_end',
                'shipped_at', 'delivered_at', 'completed_at',
            ]);
        });
    }
};
