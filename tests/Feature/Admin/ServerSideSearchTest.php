<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Major;
use App\Models\QuestionBank;
use App\Models\School;
use App\Models\University;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('finds admin user search results beyond the current page and keeps the search on pagination', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    foreach (range(1, 10) as $index) {
        User::factory()->create([
            'role' => 'teacher',
            'name' => "Other teacher {$index}",
        ]);
    }

    foreach (range(1, 11) as $index) {
        User::factory()->create([
            'role' => 'teacher',
            'name' => "Needle teacher {$index}",
        ]);
    }

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'search' => 'Needle',
            'role' => 'teacher',
            'per_page' => 10,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/UserIndex')
            ->has('users.data', 10)
            ->where('users.total', 11)
            ->where('filters.search', 'Needle')
            ->where('filters.role', 'teacher')
            ->where('users.links.2.url', fn (?string $url) => str_contains($url ?? '', 'search=Needle')));

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'search' => 'Needle',
            'role' => 'teacher',
            'per_page' => 10,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 1)
            ->where('users.current_page', 2)
            ->where('users.data.0.name', 'Needle teacher 11'));
});

it('filters admin school and university searches before pagination', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    foreach (range(1, 10) as $index) {
        School::create([
            'name' => "Other school {$index}",
            'description' => 'No match',
        ]);
    }

    $targetSchool = School::create([
        'name' => 'Target campus',
        'description' => 'Searchable school',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.schools.index', ['search' => 'Target campus']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/schools/SchoolIndex')
            ->has('schools.data', 1)
            ->where('schools.data.0.id', $targetSchool->id));

    foreach (range(1, 10) as $index) {
        University::create([
            'name' => "Other university {$index}",
            'code' => "OTHER{$index}",
        ]);
    }

    $targetUniversity = University::create([
        'name' => 'University of Search',
        'code' => 'FINDME',
    ]);

    Major::create([
        'university_id' => $targetUniversity->id,
        'name' => 'Target program',
        'minimum_passing_grade' => 70,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.universities.index', ['search' => 'Target program']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/universities/UnivIndex')
            ->has('universities.data', 1)
            ->where('universities.data.0.id', $targetUniversity->id));
});

it('finds admin and teacher question banks beyond the first page', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher']);

    foreach (range(1, 10) as $index) {
        QuestionBank::create([
            'teacher_id' => $teacher->id,
            'name' => "Other bank {$index}",
        ]);
    }

    QuestionBank::create([
        'teacher_id' => $teacher->id,
        'name' => 'Target bank',
        'description' => 'Distinctive target',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.question-banks.index', ['search' => 'Distinctive']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/question-banks/QuestionBankIndex')
            ->has('questionBanks.data', 1)
            ->where('questionBanks.data.0.name', 'Target bank'));

    $this->actingAs($teacher)
        ->get(route('teacher.question-banks.index', ['search' => 'Distinctive']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('teacher/question-banks/QuestionBankIndex')
            ->has('questionBanks.data', 1)
            ->where('questionBanks.data.0.name', 'Target bank'));
});

it('matches admin exam searches against exam and question bank names', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $bank = QuestionBank::create([
        'teacher_id' => User::factory()->create(['role' => 'teacher'])->id,
        'name' => 'Unique science bank',
    ]);

    foreach (range(1, 10) as $index) {
        Exam::create([
            'admin_id' => $admin->id,
            'name' => "Other exam {$index}",
            'type' => ExamType::UTBK->value,
        ]);
    }

    $targetExam = Exam::create([
        'admin_id' => $admin->id,
        'name' => 'Unrelated exam title',
        'type' => ExamType::UTBK->value,
    ]);
    $targetExam->questionBanks()->attach($bank->id, [
        'duration_minutes' => 60,
        'sort_order' => 0,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.exams.index', [
            'type' => ExamType::UTBK->value,
            'search' => 'Unique science',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/exams/IndexExam')
            ->has('exams.data', 1)
            ->where('exams.data.0.id', $targetExam->id));
});

it('filters student exam and history searches on the server', function () {
    $school = School::create(['name' => 'Student school']);
    $student = User::factory()->create([
        'role' => 'student',
        'school_id' => $school->id,
        'account_type' => 'pro',
    ]);

    foreach (range(1, 15) as $index) {
        Exam::create([
            'admin_id' => User::factory()->create(['role' => 'admin'])->id,
            'school_id' => $school->id,
            'name' => "Other exam {$index}",
            'type' => ExamType::UTBK->value,
            'is_published' => true,
        ]);
    }

    $targetExam = Exam::create([
        'admin_id' => User::factory()->create(['role' => 'admin'])->id,
        'school_id' => $school->id,
        'name' => 'Target exam',
        'type' => ExamType::UTBK->value,
        'is_published' => true,
    ]);

    $this->actingAs($student)
        ->get(route('student.exams.index', ['q' => 'Target exam']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/exams/IndexExam')
            ->has('exams.data', 1)
            ->where('exams.data.0.id', $targetExam->id)
            ->where('filters.q', 'Target exam'));

    foreach (range(1, 20) as $index) {
        $exam = Exam::create([
            'admin_id' => User::factory()->create(['role' => 'admin'])->id,
            'name' => "History exam {$index}",
            'type' => ExamType::UTBK->value,
        ]);

        ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'started_at' => now(),
            'completed_at' => now(),
            'status' => 'submitted',
        ]);
    }

    $targetHistoryExam = Exam::create([
        'admin_id' => User::factory()->create(['role' => 'admin'])->id,
        'name' => 'Target history',
        'type' => ExamType::UTBK->value,
    ]);

    ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $targetHistoryExam->id,
        'started_at' => now(),
        'completed_at' => now(),
        'status' => 'submitted',
    ]);

    $this->actingAs($student)
        ->get(route('student.exams.history', ['q' => 'Target history']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/exams/HistoryExam')
            ->has('attempts.data', 1)
            ->where('attempts.data.0.exam.name', 'Target history')
            ->where('filters.q', 'Target history'));
});
