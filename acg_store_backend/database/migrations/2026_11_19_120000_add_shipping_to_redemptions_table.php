<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reward redemptions are shipped just like product orders, so they need
     * an address, estimated delivery dates and shipping timestamps.
     */
    public function up(): void
    {
        Schema::table('redemptions', function (Blueprint $table) {
            if (! Schema::hasColumn('redemptions', 'shipping_address')) {
                $table->text('shipping_address')->nullable();
            }
            if (! Schema::hasColumn('redemptions', 'estimated_delivery_start')) {
                $table->date('estimated_delivery_start')->nullable();
            }
            if (! Schema::hasColumn('redemptions', 'estimated_delivery_end')) {
                $table->date('estimated_delivery_end')->nullable();
            }
            if (! Schema::hasColumn('redemptions', 'shipped_at')) {
                $table->timestamp('shipped_at')->nullable();
            }
            if (! Schema::hasColumn('redemptions', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('redemptions', function (Blueprint $table) {
            foreach (['shipping_address', 'estimated_delivery_start', 'estimated_delivery_end', 'shipped_at', 'delivered_at'] as $column) {
                if (Schema::hasColumn('redemptions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
