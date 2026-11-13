<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('users', 'membership_status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('membership_status', ['active','inactive'])->default('inactive')->after('membership_expiry');
            });
        }
    }
    public function down(): void {
        if (Schema::hasColumn('users', 'membership_status')) {
            Schema::table('users', function (Blueprint $table) { $table->dropColumn('membership_status'); });
        }
    }
};
