<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::create(['name' => 'SMA Negeri 1 Rejang Lebong', 'description' => 'Sekolah negeri']);
        School::create(['name' => 'SMA Negeri 2 Rejang Lebong', 'description' => 'Sekolah negeri']);
        School::create(['name' => 'SMA Negeri 3 Rejang Lebong', 'description' => 'Sekolah negeri']);
        School::create(['name' => 'SMK Negeri 1 Rejang Lebong', 'description' => 'Sekolah negeri kejuruan']);
    }
}
