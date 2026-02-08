<?php

namespace App\Services;

use App\Models\ExamAttempt;
use Barryvdh\DomPDF\Facade\Pdf;

class ExamResultsPdfService
{
    public function generate(ExamAttempt $attempt)
    {
        $student = $attempt->student;
        $exam = $attempt->exam;
        $passingScore = $student?->major?->minimum_passing_grade ?? 0;
        $isPassed = $attempt->score >= $passingScore;

        $exam->loadMissing(['questionBanks.questions.options']);

        $questions = $exam->questionBanks
            ->flatMap(fn($bank) => $bank->questions)
            ->unique('id')
            ->values();

        // Get question details
        $questionDetails = $questions
            ->map(function ($question) use ($attempt) {
                $response = $attempt->responses()
                    ->where('question_id', $question->id)
                    ->first();

                $correctOption = $question->options()
                    ->where('is_correct', true)
                    ->first();

                return [
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'student_answer' => $response?->selectedOption?->option_text,
                    'correct_answer' => $correctOption?->option_text,
                    'is_correct' => $response?->selectedOption?->is_correct ?? false,
                    'points_earned' => $response ? ($response->selectedOption?->is_correct ? $question->points : 0) : 0,
                ];
            });

        $data = [
            'student_name' => $student->name,
            'student_email' => $student->email,
            'university' => $student->university?->name,
            'major' => $student->major?->name,
            'school' => $student->school?->name ?? 'N/A',
            'class' => $student->class ?? 'N/A',
            'exam_name' => $exam->name,
            'exam_date' => $attempt->completed_at?->format('Y-m-d H:i'),
            'score' => $attempt->score,
            'total_score' => $attempt->total_score,
            'percentage' => $questions->count() > 0
                ? round(($attempt->score / $questions->count()) * 100, 2)
                : 0,
            'passing_score' => $passingScore,
            'is_passed' => $isPassed,
            'status' => $isPassed ? 'PASSED' : 'FAILED',
            'questions' => $questionDetails,
        ];

        return Pdf::loadView('pdfs.exam-results', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 0.5)
            ->setOption('margin-right', 0.5)
            ->setOption('margin-bottom', 0.5)
            ->setOption('margin-left', 0.5);
    }
}
