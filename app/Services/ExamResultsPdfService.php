<?php

namespace App\Services;

use App\Models\ExamAttempt;
use App\Models\Major;
use App\Models\University;
use Barryvdh\DomPDF\Facade\Pdf;

class ExamResultsPdfService
{
    private const ATTIN_FORMULA = 1525.0;

    public function generate(ExamAttempt $attempt)
    {
        $student = $attempt->student;
        $exam    = $attempt->exam;

        $exam->loadMissing([
            'questionBanks' => fn($q) => $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order'),
            'questionBanks.questions.options',
        ]);

        $sortedBanks = $exam->questionBanks
            ->sortBy(fn($bank) => $bank->pivot?->sort_order ?? 0)
            ->values();

        $bankCount   = $sortedBanks->count();
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;

        // University / major from university_selections JSON
        // Same logic as Admin ExamController::attemptDetail
        $selections     = $student->university_selections ?? [];
        $firstSelection = $selections[0] ?? null;
        $firstMajorId   = $firstSelection['majors'][0] ?? null;

        $selectedMajor      = $firstMajorId ? Major::find($firstMajorId) : null;
        $selectedUniversity = $firstSelection ? University::find($firstSelection['university_id']) : null;

        $universityName = $selectedUniversity?->name ?? 'N/A';
        $majorName      = $selectedMajor?->name      ?? 'N/A';
        $passingScore   = $selectedMajor?->minimum_passing_grade
            ?? $student->major?->minimum_passing_grade
            ?? 0;

        // Build response map
        $responsesByQuestion = $attempt->responses()
            ->with('selectedOption')
            ->get()
            ->keyBy('question_id');

        // Per-block question sections
        $questionSections = $sortedBanks->map(function ($bank, $index) use ($responsesByQuestion) {
            $questions = $bank->questions->unique('id')->values();

            $correct = 0;
            $mappedQuestions = $questions->map(function ($question) use ($responsesByQuestion, &$correct) {
                $response      = $responsesByQuestion->get($question->id);
                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect     = (bool) ($response?->selectedOption?->is_correct ?? false);

                if ($isCorrect) {
                    $correct++;
                }

                return [
                    'question_text'  => $question->question_text,
                    'question_type'  => $question->question_type,
                    'points'         => $question->points,
                    'student_answer' => $response?->selectedOption?->option_text,
                    'correct_answer' => $correctOption?->option_text,
                    'is_correct'     => $isCorrect,
                    'points_earned'  => $isCorrect ? $question->points : 0,
                    'irt_b'          => $question->irt_b,
                ];
            });

            $total      = $questions->count();
            $blockScore = $total > 0 ? ($correct / $total) * 1000 : 0;

            return [
                'bank_name'   => $bank->name,
                'bank_index'  => $index + 1,
                'correct'     => $correct,
                'total'       => $total,
                'block_score' => round($blockScore, 2),
                'questions'   => $mappedQuestions,
            ];
        });

        // IRT scores
        $totalSkor   = $questionSections->sum('block_score');
        $skorUtbk    = round($totalSkor / $bankDivisor, 2);
        $skorUtbkPct = round(($skorUtbk / self::ATTIN_FORMULA) * 100, 2);
        $isPassed    = $skorUtbkPct >= $passingScore;

        $data = [
            'student_name'  => $student->name,
            'student_email' => $student->email,
            'university'    => $universityName,
            'major'         => $majorName,
            'major_min_gpa' => $passingScore,
            'school'        => $student->school?->name ?? 'N/A',
            'class'         => $student->class ?? 'N/A',

            'exam_name' => $exam->name,
            'exam_date' => $attempt->completed_at?->format('Y-m-d H:i'),

            'theta'         => $attempt->irt_theta !== null ? round($attempt->irt_theta, 4) : null,
            'total_skor'    => round($totalSkor, 2),
            'skor_utbk'     => $skorUtbk,
            'skor_utbk_pct' => $skorUtbkPct,

            'passing_score' => $passingScore,
            'is_passed'     => $isPassed,
            'status'        => $isPassed ? 'LULUS' : 'TIDAK LULUS',

            // Legacy aliases so Blade does not break
            'score'       => $skorUtbk,
            'total_score' => self::ATTIN_FORMULA,
            'percentage'  => $skorUtbkPct,

            'question_sections' => $questionSections,
        ];

        return Pdf::loadView('pdfs.exam-results', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 0.5)
            ->setOption('margin-right', 0.5)
            ->setOption('margin-bottom', 0.5)
            ->setOption('margin-left', 0.5);
    }
}
