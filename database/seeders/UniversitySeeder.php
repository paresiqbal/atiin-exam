<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Seeder;

class UniversitySeeder extends Seeder
{
    public function run(): void
    {
        University::create([
            'name' => 'Harvard University',
            'description' => 'Leading research university',
            'website' => 'https://www.harvard.edu',
        ]);

        University::create([
            'name' => 'MIT',
            'description' => 'Massachusetts Institute of Technology',
            'website' => 'https://www.mit.edu',
        ]);

        University::create([
            'name' => 'Stanford University',
            'description' => 'Private research university',
            'website' => 'https://www.stanford.edu',
        ]);
    }
}
