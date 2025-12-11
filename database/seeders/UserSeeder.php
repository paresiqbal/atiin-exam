<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin user
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

        // 2. Teacher user
        User::create([
            'name' => 'Falah Izudin',
            'email' => 'teacher@example.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'university_id' => null,
            'major_id' => null,
            'school_id' => null,
            'class' => null,
        ]);

        // 3. Student user (Original)
        User::create([
            'name' => 'Pahreza Iqbal Prastowo',
            'email' => 'student@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '10A',
        ]);

        // --- NEW STUDENTS BELOW ---

        // 4. Student user
        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '10A',
        ]);

        // 5. Student user
        User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '10B',
        ]);

        // 6. Student user
        User::create([
            'name' => 'Rudi Hartono',
            'email' => 'rudi@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '11A',
        ]);

        // 7. Student user
        User::create([
            'name' => 'Dewi Lestari',
            'email' => 'dewi@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '11B',
        ]);

        // 8. Student user
        User::create([
            'name' => 'Agus Setiawan',
            'email' => 'agus@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'university_id' => 1,
            'major_id' => 1,
            'school_id' => 1,
            'class' => '12A',
        ]);
    }
}
