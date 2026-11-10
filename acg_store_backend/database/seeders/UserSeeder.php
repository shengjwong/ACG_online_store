<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin Account
        User::updateOrCreate(
            ['email' => 'admin@acgstore.com'],
            [
                'name' => 'Sheng Jie',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone_number' => '+60123456789',
                'membership_tier' => 'Gold',
            ]
        );

        // Create Sample Member Account
        User::updateOrCreate(
            ['email' => 'member@acgstore.com'],
            [
                'name' => 'Otaku Customer',
                'password' => Hash::make('password123'),
                'role' => 'member',
                'phone_number' => '+60198765432',
                'membership_tier' => 'Normal',
            ]
        );
    }
}