<?php

use App\Enums\ExamType;
use App\Models\Exam;
use App\Services\IrtRaschService;

it('uses IRT for UTBK and TKA but not CBT', function (ExamType $type, bool $usesIrt) {
    expect($type->usesIrt())->toBe($usesIrt);
})->with([
    'UTBK' => [ExamType::UTBK, true],
    'TKA' => [ExamType::TKA, true],
    'CBT' => [ExamType::CBT, false],
]);

it('refuses to run Rasch scoring for CBT exams', function () {
    $exam = new Exam(['type' => ExamType::CBT]);

    $result = (new IrtRaschService)->scoreExam($exam);

    expect($result['success'])->toBeFalse()
        ->and($result['message'])->toContain('UTBK and TKA');
});
