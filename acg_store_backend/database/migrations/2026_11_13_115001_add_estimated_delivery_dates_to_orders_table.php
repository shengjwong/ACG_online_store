
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('orders', 'estimated_delivery_start')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->date('estimated_delivery_start')->nullable();
            });
        }

        if (!Schema::hasColumn('orders', 'estimated_delivery_end')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->date('estimated_delivery_end')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orders', 'estimated_delivery_start')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('estimated_delivery_start');
            });
        }

        if (Schema::hasColumn('orders', 'estimated_delivery_end')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('estimated_delivery_end');
            });
        }
    }
};
