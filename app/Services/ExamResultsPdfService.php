<?php

namespace App\Services;

use App\Enums\ExamType;
use App\Models\ExamAttempt;
use Barryvdh\DomPDF\Facade\Pdf;

class ExamResultsPdfService
{
    private const ATTIN_FORMULA = 1525.0;

    public function generate(ExamAttempt $attempt)
    {
        $student = $attempt->student;
        $exam = $attempt->exam;

        $exam->loadMissing([
            'questionBanks' => fn ($q) => $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order'),
            'questionBanks.questions.options',
        ]);

        $sortedBanks = $exam->questionBanks
            ->sortBy(fn ($bank) => $bank->pivot?->sort_order ?? 0)
            ->values();

        $bankCount = $sortedBanks->count();
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;

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
                $response = $responsesByQuestion->get($question->id);
                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);

                if ($isCorrect) {
                    $correct++;
                }

                return [
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'image_url' => $question->image_url,
                    'student_answer' => $response?->selectedOption?->option_text,
                    'correct_answer' => $correctOption?->option_text,
                    'is_correct' => $isCorrect,
                    'points_earned' => $isCorrect ? $question->points : 0,
                    'irt_b' => $question->irt_b,
                ];
            });

            $total = $questions->count();
            $blockScore = $total > 0 ? ($correct / $total) * 1000 : 0;

            return [
                'bank_name' => $bank->name,
                'bank_index' => $index + 1,
                'correct' => $correct,
                'total' => $total,
                'block_score' => round($blockScore, 2),
                'questions' => $mappedQuestions,
            ];
        });

        // IRT scores
        $totalSkor = $questionSections->sum('block_score');
        $skorUtbk = round($totalSkor / $bankDivisor, 2);
        $skorUtbkPct = round(($skorUtbk / self::ATTIN_FORMULA) * 100, 2);
        $data = [
            'student_name' => $student->name,
            'student_email' => $student->email,
            'school' => $student->school?->name ?? 'N/A',
            'class' => $student->class ?? 'N/A',

            'exam_name' => $exam->name,
            'exam_date' => $attempt->completed_at?->format('Y-m-d H:i'),
            'score_label' => $exam->type === ExamType::UTBK ? 'Skor UTBK' : 'Skor IRT',
            'percent_score_label' => $exam->type === ExamType::UTBK ? 'Skor UTBK (%)' : 'Skor IRT (%)',

            'theta' => $attempt->irt_theta !== null ? round($attempt->irt_theta, 4) : null,
            'total_skor' => round($totalSkor, 2),
            'skor_utbk' => $skorUtbk,
            'skor_utbk_pct' => $skorUtbkPct,

            'status' => 'HASIL UJIAN',

            // Legacy aliases so Blade does not break
            'score' => $skorUtbk,
            'total_score' => self::ATTIN_FORMULA,
            'percentage' => $skorUtbkPct,

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
