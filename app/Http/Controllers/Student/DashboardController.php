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
        $passingScore = $student->major->minimum_passing_grade ?? 0;

        $passedExams = $attempts->filter(function ($attempt) use ($passingScore) {
            return $attempt->score >= $passingScore;
        })->count();

        $failedExams = $totalExams - $passedExams;

        $averageScore = $totalExams > 0
            ? round($attempts->avg('score'), 2)
            : 0;

        $passRate = $totalExams > 0
            ? round(($passedExams / $totalExams) * 100, 2)
            : 0;

        // Get latest 5 attempts for recent activity
        $recentAttempts = $attempts->take(5)->map(function ($attempt) use ($passingScore) {
            return [
                'id' => $attempt->id,
                'exam_name' => $attempt->exam->name,
                'score' => $attempt->score,
                'total_score' => $attempt->total_score,
                'percentage' => $attempt->total_score > 0
                    ? round(($attempt->score / $attempt->total_score) * 100, 2)
                    : 0,
                'status' => $attempt->score >= $passingScore ? 'passed' : 'failed',
                'completed_at' => $attempt->completed_at?->format('M d, Y'),
                'time_taken' => $attempt->completed_at
                    ? $attempt->completed_at->diffInMinutes($attempt->started_at) . ' min'
                    : 'N/A',
            ];
        });

        // Score trend (last 10 exams)
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

        // Performance by exam
        $performanceByExam = $attempts->groupBy('exam_id')
            ->map(function ($attempts) use ($passingScore) {
                $correct = 0;
                $total = 0;

                foreach ($attempts as $attempt) {
                    $responses = $attempt->responses;
                    foreach ($responses as $response) {
                        $total++;
                        if ($response->selectedOption && $response->selectedOption->is_correct) {
                            $correct++;
                        }
                    }
                }

                $firstAttempt = $attempts->first();
                return [
                    'exam_name' => $firstAttempt->exam->name,
                    'correct_answers' => $correct,
                    'total_questions' => $total,
                    'accuracy' => $total > 0 ? round(($correct / $total) * 100, 2) : 0,
                    'status' => $firstAttempt->score >= $passingScore ? 'passed' : 'failed',
                ];
            })->values();

        // Student info
        $studentInfo = [
            'name' => $student->name,
            'email' => $student->email,
            'university' => $student->university?->name ?? 'Not selected',
            'major' => $student->major?->name ?? 'Not selected',
            'school' => $student->school?->name ?? 'Not assigned',
            'class' => $student->class ?? 'N/A',
        ];

        return Inertia::render('student/dashboard/Index', [
            'student_info' => $studentInfo,
            'statistics' => [
                'total_exams' => $totalExams,
                'passed_exams' => $passedExams,
                'failed_exams' => $failedExams,
                'average_score' => $averageScore,
                'pass_rate' => $passRate,
                'passing_grade' => $passingScore,
            ],
            'recent_attempts' => $recentAttempts,
            'score_trend' => $scoreTrend,
            'performance_by_exam' => $performanceByExam,
        ]);
    }
}
