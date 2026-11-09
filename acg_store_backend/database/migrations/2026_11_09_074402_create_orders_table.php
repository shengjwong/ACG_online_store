<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('processed_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('shipping_fee', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->text('shipping_address');
            $table->string('tracking_number')->nullable();
            $table->string('courier_name')->nullable();
            $table->enum('order_status', ['pending', 'paid', 'shipped', 'completed', 'cancel_pending', 'cancelled'])->default('pending');
            $table->text('cancel_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};