<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::create(['name' => 'Senior High School A', 'description' => 'Public school']);
        School::create(['name' => 'Senior High School B', 'description' => 'Public school']);
        School::create(['name' => 'Private Academy C', 'description' => 'Private school']);
    }
}
