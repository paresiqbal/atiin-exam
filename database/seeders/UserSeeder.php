<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'university_id' => null,
            'major_id' => null,
            'school_id' => null,
            'class' => null,
        ]);

        // Teacher user
        User::create([
            'name' => 'Teacher User',
            'email' => 'teacher@example.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'university_id' => null,
            'major_id' => null,
            'school_id' => null,
            'class' => null,
        ]);

        // Student user
        User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '10A',
        ]);
    }
}
