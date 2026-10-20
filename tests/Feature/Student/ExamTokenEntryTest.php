<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function createExamWithToken(ExamType $type, User $admin): array
{
    $exam = Exam::create([
        'admin_id' => $admin->id,
        'name' => "{$type->value} Exam",
        'type' => $type,
        'is_published' => true,
        'start_at' => now()->subMinute(),
        'end_at' => now()->addHour(),
    ]);

    $questionBank = QuestionBank::create([
        'teacher_id' => $admin->id,
        'name' => 'Question bank',
    ]);

    $exam->questionBanks()->attach($questionBank->id, [
        'duration_minutes' => 30,
        'sort_order' => 1,
    ]);

    $token = ExamToken::create([
        'exam_id' => $exam->id,
        'token' => strtoupper(fake()->unique()->bothify('TOKEN-####')),
    ]);

    return [$exam, $token];
}

it('starts UTBK and TKA exams using only a token without changing saved university selections', function (ExamType $type) {
    $student = User::factory()->create([
        'role' => 'student',
        'university_selections' => [
            ['university_id' => 12, 'majors' => [34]],
        ],
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam, $token] = createExamWithToken($type, $admin);

    $this->actingAs($student)
        ->post(route('student.exams.start'), ['token' => $token->token])
        ->assertRedirect();

    expect(ExamAttempt::query()
        ->where('student_id', $student->id)
        ->where('exam_id', $exam->id)
        ->exists())->toBeTrue();
    expect($student->fresh()->university_selections)->toBe([
        ['university_id' => 12, 'majors' => [34]],
    ]);
})->with([
    'UTBK' => ExamType::UTBK,
    'TKA' => ExamType::TKA,
]);

it('reports an invalid token on the token field', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)
        ->post(route('student.exams.start'), ['token' => 'INVALID'])
        ->assertSessionHasErrors('token');
});

it('keeps the submitted attempt limit check on token entry', function () {
    $student = User::factory()->create(['role' => 'student']);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam, $token] = createExamWithToken(ExamType::UTBK, $admin);

    ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now()->subMinutes(45),
        'status' => 'submitted',
        'completed_at' => now()->subMinutes(15),
    ]);

    $this->actingAs($student)
        ->post(route('student.exams.start'), ['token' => $token->token])
        ->assertSessionHasErrors('token');
});

it('renders TKA results using IRT data without university or major selections', function () {
    $student = User::factory()->create(['role' => 'student']);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam] = createExamWithToken(ExamType::TKA, $admin);
    $exam->update(['irt_processed_at' => now()]);

    $attempt = ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now()->subHour(),
        'completed_at' => now(),
        'score' => 18,
        'total_score' => 30,
        'irt_theta' => 0.72,
        'irt_block_score' => 60,
        'status' => 'submitted',
    ]);

    $this->actingAs($student)
        ->get(route('student.exams.results', $attempt))
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/exams/Results')
            ->where('exam.type', 'tka')
            ->where('attempt.irt_theta', 0.72)
            ->missing('studentPlacement')
            ->missing('universitySelections'));
});

it('rejects CBT from every IRT processing and download endpoint', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam] = createExamWithToken(ExamType::CBT, $admin);
    $student = User::factory()->create(['role' => 'student']);
    $attempt = ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now()->subHour(),
        'status' => 'submitted',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.irt.process', $exam))
        ->assertSessionHas('error');

    $this->post(route('admin.irt.run-bulk'), ['exam_id' => $exam->id])
        ->assertSessionHas('error');

    $this->post(route('admin.irt.process-multiple'), ['exam_ids' => [$exam->id]])
        ->assertSessionHas('error');

    $this->get(route('admin.irt.export', $exam))
        ->assertSessionHas('error');

    $this->post(route('admin.exams.process-irt', $exam))
        ->assertSessionHas('error');

    $this->get("/admin/exams/{$exam->id}/irt-export")
        ->assertSessionHas('error');

    $this->get(route('admin.attempts.download-pdf', $attempt))
        ->assertSessionHas('error');

    $this->get(route('admin.attempts.download-letter', $attempt))
        ->assertSessionHas('error');
});

it('lists UTBK and TKA but never CBT in IRT processing', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    createExamWithToken(ExamType::UTBK, $admin);
    createExamWithToken(ExamType::TKA, $admin);
    createExamWithToken(ExamType::CBT, $admin);

    $this->actingAs($admin)
        ->get(route('admin.irt.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/irt/IrtProcessing')
            ->where('exams.total', 2));

    $this->get(route('admin.irt.index', ['type' => 'tka']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/irt/IrtProcessing')
            ->where('exams.total', 1)
            ->where('exams.data.0.type', 'tka'));
});
