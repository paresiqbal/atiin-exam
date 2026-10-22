<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('returns up to five results per admin search group', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    foreach (range(1, 6) as $index) {
        User::factory()->create([
            'role' => 'student',
            'name' => "Search student {$index}",
        ]);
        Exam::create([
            'admin_id' => $admin->id,
            'name' => "Search exam {$index}",
            'type' => ExamType::UTBK->value,
        ]);
        QuestionBank::create([
            'teacher_id' => User::factory()->create(['role' => 'teacher'])->id,
            'name' => "Search question bank {$index}",
        ]);
    }

    $this->actingAs($admin)
        ->getJson(route('admin.search', ['q' => 'Search']))
        ->assertOk()
        ->assertJsonCount(5, 'students')
        ->assertJsonCount(5, 'exams')
        ->assertJsonCount(5, 'question_banks')
        ->assertJsonPath('students.0.label', 'Search student 1');
});

it('forbids students from calling the admin search endpoint', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)
        ->getJson(route('admin.search', ['q' => 'Search']))
        ->assertForbidden();
});
