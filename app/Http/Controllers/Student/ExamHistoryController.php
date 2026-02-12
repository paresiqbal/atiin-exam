<?php

namespace App\Http\Controllers\Student;

use App\Models\ExamAttempt;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ExamHistoryController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $attempts = ExamAttempt::where('student_id', $student->id)
            ->with('exam.questionBanks', 'student.major')
            ->orderByDesc('completed_at')
            ->paginate(20);

        // Add status to each attempt
        $attempts->getCollection()->transform(function ($attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
            $bankCount = $attempt->exam->questionBanks->count();
            $bankDivisor = $bankCount > 0 ? $bankCount : 1;
            $adjustedScore = (float) ($attempt->score ?? 0) / $bankDivisor;
            $adjustedTotalScore = (float) ($attempt->total_score ?? 0) / $bankDivisor;

            $attempt->is_passed = $attempt->score >= $passingScore;
            $attempt->adjusted_score = (int) floor($adjustedScore);
            $attempt->adjusted_total_score = (int) floor($adjustedTotalScore);
            $attempt->question_bank_count = $bankCount;
            $attempt->percentage = $adjustedTotalScore > 0
                ? round(($adjustedScore / $adjustedTotalScore) * 100, 2)
                : 0;

            // 👇 pick whatever field your Exam model uses
            $attempt->exam_name = $attempt->exam->title
                ?? $attempt->exam->name
                ?? 'Unknown Exam';

            return $attempt;
        });

        return Inertia::render('student/exams/HistoryExam', [
            'attempts' => $attempts,
        ]);
    }
}
