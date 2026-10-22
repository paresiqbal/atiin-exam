<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Major;
use App\Models\University;
use App\Models\User;
use App\Services\ExamResultsPdfService;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function makeExamAttempt(ExamType $type, ?float $irtScore, array $studentAttributes = []): ExamAttempt
{
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(array_merge(['role' => 'student'], $studentAttributes));
    $exam = Exam::create([
        'admin_id' => $admin->id,
        'name' => "{$type->value} attempt test",
        'type' => $type->value,
    ]);

    return ExamAttempt::create([
        'student_id' => $student->id,
        'exam_id' => $exam->id,
        'started_at' => now(),
        'status' => 'submitted',
        'score' => 20,
        'total_score' => 25,
        'irt_block_score' => $irtScore,
    ]);
}

it('uses the first selected major threshold and allows equality for UTBK and TKA', function (ExamType $type) {
    $university = University::create(['name' => 'Passing university']);
    $selectedMajor = Major::create([
        'university_id' => $university->id,
        'name' => 'Selected program',
        'minimum_passing_grade' => 762.5,
    ]);
    $profileMajor = Major::create([
        'university_id' => $university->id,
        'name' => 'Profile program',
        'minimum_passing_grade' => 500,
    ]);

    $attempt = makeExamAttempt($type, 50, [
        'major_id' => $profileMajor->id,
        'university_selections' => [[
            'university_id' => $university->id,
            'majors' => [$selectedMajor->id],
        ]],
    ]);

    expect($attempt->scoreOnPassingScale())->toBe(762.5)
        ->and($attempt->minimumPassingScore())->toBe(762.5)
        ->and($attempt->isPassed())->toBeTrue();
})->with([
    'UTBK' => ExamType::UTBK,
    'TKA' => ExamType::TKA,
]);

it('uses the profile major as a fallback threshold', function (ExamType $type) {
    $university = University::create(['name' => 'Profile university']);
    $profileMajor = Major::create([
        'university_id' => $university->id,
        'name' => 'Profile program',
        'minimum_passing_grade' => 800,
    ]);

    $attempt = makeExamAttempt($type, 50, ['major_id' => $profileMajor->id]);

    expect($attempt->minimumPassingScore())->toBe(800.0)
        ->and($attempt->isPassed())->toBeFalse();
})->with([
    'UTBK' => ExamType::UTBK,
    'TKA' => ExamType::TKA,
]);

it('does not assign pass or fail to CBT or attempts without a score or threshold', function () {
    $university = University::create(['name' => 'CBT university']);
    $major = Major::create([
        'university_id' => $university->id,
        'name' => 'CBT program',
        'minimum_passing_grade' => 100,
    ]);

    $cbtAttempt = makeExamAttempt(ExamType::CBT, 50, ['major_id' => $major->id]);
    $missingScoreAttempt = makeExamAttempt(ExamType::UTBK, null, ['major_id' => $major->id]);
    $missingThresholdAttempt = makeExamAttempt(ExamType::TKA, 50);

    expect($cbtAttempt->isPassed())->toBeNull()
        ->and($missingScoreAttempt->isPassed())->toBeNull()
        ->and($missingThresholdAttempt->isPassed())->toBeNull();
});

it('shows the same shared pass result to the admin and student pages', function () {
    $university = University::create(['name' => 'Shared result university']);
    $major = Major::create([
        'university_id' => $university->id,
        'name' => 'Shared result program',
        'minimum_passing_grade' => 800,
    ]);
    $attempt = makeExamAttempt(ExamType::UTBK, 50, ['major_id' => $major->id]);
    $attempt->exam->update(['irt_processed_at' => now()]);
    $admin = User::where('role', 'admin')->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.attempts.detail', $attempt))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isPassed', false));

    $this->actingAs($admin)
        ->get(route('admin.students.show', $attempt->student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('exam_attempts.0.is_passed', false));

    $this->actingAs($attempt->student)
        ->get(route('student.exams.results', $attempt))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('attempt.is_passed', false));
});

it('passes one shared pass status to the result PDF template', function () {
    $university = University::create(['name' => 'PDF university']);
    $major = Major::create([
        'university_id' => $university->id,
        'name' => 'PDF program',
        'minimum_passing_grade' => 800,
    ]);
    $attempt = makeExamAttempt(ExamType::UTBK, 50, ['major_id' => $major->id]);
    $pdf = Mockery::mock(DomPdf::class);
    $pdf->shouldReceive('setPaper')->once()->with('a4')->andReturnSelf();
    $pdf->shouldReceive('setOption')->times(4)->andReturnSelf();
    $pdfData = [];

    Pdf::shouldReceive('loadView')
        ->once()
        ->with('pdfs.exam-results', Mockery::on(function (array $data) use (&$pdfData): bool {
            $pdfData = $data;

            return $data['pass_status'] === 'TIDAK LULUS'
                && $data['pass_status_class'] === 'failed';
        }))
        ->andReturn($pdf);

    (new ExamResultsPdfService)->generate($attempt);

    expect(view('pdfs.exam-results', $pdfData)->render())->toContain('TIDAK LULUS');
});
