<?php

namespace App\Http\Controllers\Student;

use App\Enums\ExamType;
use App\Models\ExamAttempt;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ExamHistoryController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $attempts = ExamAttempt::where('student_id', $student->id)
            ->with('exam.questionBanks')
            ->orderByDesc('completed_at')
            ->paginate(20);

        $attempts->getCollection()->transform(function ($attempt) {
            $examType = $attempt->exam?->type;
            $irtProcessed = $examType?->usesIrt()
                && (bool) $attempt->exam?->irt_processed_at
                && $attempt->irt_block_score !== null;

            $attempt->percentage = match (true) {
                $irtProcessed => (float) $attempt->irt_block_score,
                $examType === ExamType::CBT && (float) $attempt->total_score > 0 => ((float) $attempt->score / (float) $attempt->total_score) * 100,
                default => null,
            };
            $attempt->is_passed = null;
            if (! $examType?->usesIrt()) {
                $attempt->irt_theta = null;
            }
            $attempt->exam_name = $attempt->exam->title
                ?? $attempt->exam->name
                ?? 'Unknown Exam';
            $attempt->exam_type = $examType?->value;

            return $attempt;
        });

        return Inertia::render('student/exams/HistoryExam', [
            'attempts' => $attempts,
        ]);
    }
}
