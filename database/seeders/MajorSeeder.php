<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Seeder;

class MajorSeeder extends Seeder
{
    public function run(): void
    {
        $harvard = University::where('name', 'Harvard University')->first();
        $mit = University::where('name', 'MIT')->first();
        $stanford = University::where('name', 'Stanford University')->first();

        // Harvard majors
        $harvard->majors()->create([
            'name' => 'Computer Science',
            'description' => 'Study of computation',
            'minimum_passing_grade' => 75,
        ]);

        $harvard->majors()->create([
            'name' => 'Business Administration',
            'description' => 'Business and management',
            'minimum_passing_grade' => 70,
        ]);

        // MIT majors
        $mit->majors()->create([
            'name' => 'Engineering',
            'description' => 'Various engineering disciplines',
            'minimum_passing_grade' => 80,
        ]);

        $mit->majors()->create([
            'name' => 'Physics',
            'description' => 'Physics and mathematics',
            'minimum_passing_grade' => 78,
        ]);

        // Stanford majors
        $stanford->majors()->create([
            'name' => 'Data Science',
            'description' => 'Data analysis and machine learning',
            'minimum_passing_grade' => 72,
        ]);

        $stanford->majors()->create([
            'name' => 'Economics',
            'description' => 'Economic studies',
            'minimum_passing_grade' => 71,
        ]);
    }
}
