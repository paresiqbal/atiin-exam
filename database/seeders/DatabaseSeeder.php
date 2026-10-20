<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make(Str::password(16)),
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            SchoolSeeder::class,
            UniversitySeeder::class,
            MajorSeeder::class,
            QuestionBankSeeder::class,
            UserSeeder::class,
        ]);
    }
}
