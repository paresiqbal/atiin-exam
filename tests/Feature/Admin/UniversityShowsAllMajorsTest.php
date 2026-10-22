<?php

use App\Models\Major;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('shows all majors on admin and student university pages', function () {
    $university = University::create([
        'name' => 'Example University',
    ]);

    foreach (range(1, 21) as $number) {
        Major::create([
            'university_id' => $university->id,
            'name' => "Major {$number}",
        ]);
    }

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->get(route('admin.universities.show', $university))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/universities/UnivShow')
            ->has('majors', 21)
            ->where('university.majors_count', 21));

    $this->actingAs(User::factory()->create([
        'role' => 'student',
        'account_type' => 'pro',
    ]))
        ->get(route('student.universities.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/universities/StudentUnivIndex')
            ->has('universities.0.majors', 21));
});
