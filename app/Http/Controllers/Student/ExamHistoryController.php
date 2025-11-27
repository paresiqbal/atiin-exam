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
            ->with('exam', 'student.major')
            ->orderByDesc('completed_at')
            ->paginate(20);

        // Add status to each attempt
        $attempts->getCollection()->transform(function ($attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;

            $attempt->is_passed = $attempt->score >= $passingScore;
            $attempt->percentage = $attempt->total_score > 0
                ? round(($attempt->score / $attempt->total_score) * 100, 2)
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
