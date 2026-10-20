<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionOption;
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

it('starts CBT using only a token and preserves saved university selections', function () {
    $student = User::factory()->create([
        'role' => 'student',
        'university_selections' => [
            ['university_id' => 12, 'majors' => [34]],
        ],
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam, $token] = createExamWithToken(ExamType::CBT, $admin);

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
});

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

it('grades CBT from question points and displays its percentage without IRT', function () {
    $student = User::factory()->create([
        'role' => 'student',
        'university_selections' => [
            ['university_id' => 12, 'majors' => [34]],
        ],
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam, $token] = createExamWithToken(ExamType::CBT, $admin);
    $exam->update(['irt_processed_at' => now()]);

    $firstBank = $exam->questionBanks()->firstOrFail();
    $secondBank = QuestionBank::create([
        'teacher_id' => $admin->id,
        'name' => 'Second question bank',
    ]);
    $exam->questionBanks()->attach($secondBank->id, [
        'duration_minutes' => 30,
        'sort_order' => 2,
    ]);

    $correctQuestion = Question::create([
        'question_bank_id' => $firstBank->id,
        'question_text' => 'Question worth two points',
        'question_type' => 'multiple_choice',
        'points' => 2,
    ]);
    $correctOption = QuestionOption::create([
        'question_id' => $correctQuestion->id,
        'option_text' => 'Correct',
        'is_correct' => true,
        'option_order' => 1,
    ]);

    $incorrectQuestion = Question::create([
        'question_bank_id' => $secondBank->id,
        'question_text' => 'Question worth three points',
        'question_type' => 'multiple_choice',
        'points' => 3,
    ]);
    $incorrectOption = QuestionOption::create([
        'question_id' => $incorrectQuestion->id,
        'option_text' => 'Incorrect',
        'is_correct' => false,
        'option_order' => 1,
    ]);

    $this->actingAs($student)
        ->post(route('student.exams.start'), ['token' => $token->token])
        ->assertRedirect();

    $attempt = ExamAttempt::query()
        ->where('student_id', $student->id)
        ->where('exam_id', $exam->id)
        ->firstOrFail();
    $attempt->update([
        'irt_theta' => 1.25,
        'irt_block_score' => 88,
    ]);
    $attempt->responses()->createMany([
        [
            'question_id' => $correctQuestion->id,
            'selected_option_id' => $correctOption->id,
        ],
        [
            'question_id' => $incorrectQuestion->id,
            'selected_option_id' => $incorrectOption->id,
        ],
    ]);

    $this->post(route('student.exams.submit', $attempt))
        ->assertRedirect(route('student.exams.results', $attempt));

    $this->get(route('student.exams.results', $attempt))
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/exams/Results')
            ->where('exam.type', 'cbt')
            ->where('attempt.score', 2)
            ->where('attempt.raw_score', 2)
            ->where('attempt.total_score', 5)
            ->where('attempt.irt_theta', null));

    expect($student->fresh()->university_selections)->toBe([
        ['university_id' => 12, 'majors' => [34]],
    ]);
});

it('shows a zero percentage for a submitted CBT attempt with no possible points', function () {
    $student = User::factory()->create([
        'role' => 'student',
        'account_type' => 'pro',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    [$exam] = createExamWithToken(ExamType::CBT, $admin);
    $attempt = ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now()->subHour(),
        'completed_at' => now(),
        'score' => 0,
        'total_score' => 0,
        'status' => 'submitted',
    ]);

    $this->actingAs($student)
        ->get(route('student.exams.history'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/exams/HistoryExam')
            ->where('attempts.data.0.id', $attempt->id)
            ->where('attempts.data.0.percentage', 0)
            ->where('attempts.data.0.raw_score', 0)
            ->where('attempts.data.0.total_score', 0));
});

it('shows points and percentages in CBT admin attempts and exports', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student']);
    [$exam] = createExamWithToken(ExamType::CBT, $admin);
    $attempt = ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now()->subHour(),
        'completed_at' => now(),
        'score' => 3,
        'total_score' => 10,
        'irt_theta' => 1.25,
        'irt_block_score' => 88,
        'status' => 'submitted',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.exams.attempts', $exam))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/exams/ExamAttempts')
            ->where('attempts.data.0.raw_score', 3)
            ->where('attempts.data.0.total_score', 10)
            ->where('attempts.data.0.adjusted_score', 3)
            ->where('attempts.data.0.score_percentage', 30)
            ->where('attempts.data.0.is_passed', null)
            ->where('analytics.average_score', 30));

    $this->get(route('admin.exams.exportResults', $exam))
        ->assertSuccessful()
        ->assertSee('Poin Diperoleh')
        ->assertSee('Poin Maksimum')
        ->assertSee('Persentase')
        ->assertSee('30.00%');

    $this->get(route('admin.attempts.detail', $attempt))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/exams/AttemptDetail')
            ->where('exam.type', 'cbt')
            ->where('isPassed', null)
            ->where('studentData.selected_major', null)
            ->where('studentData.selected_university', null));
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

    $this->actingAs($student)
        ->get(route('student.exams.downloadPdf', $attempt))
        ->assertNotFound();
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
