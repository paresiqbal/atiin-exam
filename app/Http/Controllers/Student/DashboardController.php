<?php

namespace App\Http\Controllers\Student;

use App\Models\ExamAttempt;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        // Get all exam attempts
        $attempts = ExamAttempt::where('student_id', $student->id)
            ->with('exam', 'student.major')
            ->orderByDesc('completed_at')
            ->get();

        // Calculate statistics
        $totalExams = $attempts->count();
        $passedExams = $attempts->filter(function ($attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
            return $attempt->score >= $passingScore;
        })->count();

        $averageScore = $totalExams > 0
            ? round($attempts->avg('score'), 2)
            : 0;

        $passRate = $totalExams > 0
            ? round(($passedExams / $totalExams) * 100, 2)
            : 0;

        // Get latest 5 attempts
        $recentAttempts = $attempts->take(5)->map(function ($attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
            $isPassed = $attempt->score >= $passingScore;

            return [
                'id' => $attempt->id,
                'exam_name' => $attempt->exam->name,
                'score' => $attempt->score,
                'total_score' => $attempt->total_score,
                'percentage' => $attempt->total_score > 0
                    ? round(($attempt->score / $attempt->total_score) * 100, 2)
                    : 0,
                'status' => $isPassed ? 'passed' : 'failed',
                'completed_at' => $attempt->completed_at?->format('Y-m-d H:i'),
            ];
        });

        // Score trend
        $scoreTrend = $attempts->take(10)->reverse()->map(function ($attempt, $index) {
            return [
                'exam_number' => $index + 1,
                'exam_name' => $attempt->exam->name,
                'score' => $attempt->score,
                'percentage' => $attempt->total_score > 0
                    ? round(($attempt->score / $attempt->total_score) * 100, 2)
                    : 0,
            ];
        })->values();

        return Inertia::render('student/dashboard/Index', [
            'student' => $student,
            'statistics' => [
                'total_exams' => $totalExams,
                'passed_exams' => $passedExams,
                'average_score' => $averageScore,
                'pass_rate' => $passRate,
            ],
            'recent_attempts' => $recentAttempts,
            'score_trend' => $scoreTrend,
        ]);
    }
}
