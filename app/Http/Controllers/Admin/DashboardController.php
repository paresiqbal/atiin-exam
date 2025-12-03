<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // User Statistics
        $totalUsers = User::count();
        $totalStudents = User::where('role', 'student')->count();
        $totalTeachers = User::where('role', 'teacher')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        // Exam Statistics
        $totalExams = Exam::count();
        $publishedExams = Exam::where('is_published', true)->count();
        $draftExams = Exam::where('is_published', false)->count();

        // Attempt Statistics
        $totalAttempts = ExamAttempt::count();
        $completedAttempts = ExamAttempt::where('status', 'submitted')->count();
        $inProgressAttempts = ExamAttempt::where('status', 'in_progress')->count();

        // Calculate pass/fail
        $passedAttempts = 0;
        foreach (ExamAttempt::where('status', 'submitted')->get() as $attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
            if ($attempt->score >= $passingScore) {
                $passedAttempts++;
            }
        }
        $failedAttempts = $completedAttempts - $passedAttempts;

        // Question Statistics
        $totalQuestions = Question::count();
        $totalQuestionBanks = QuestionBank::count();

        // Average Score
        $averageScore = $completedAttempts > 0
            ? round(ExamAttempt::where('status', 'submitted')->avg('score'), 2)
            : 0;

        // Recent Attempts (last 5)
        $recentAttempts = ExamAttempt::with('student', 'exam')
            ->where('status', 'submitted')
            ->orderByDesc('completed_at')
            ->take(5)
            ->get()
            ->map(function ($attempt) {
                $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
                return [
                    'id' => $attempt->id,
                    'student_name' => $attempt->student->name,
                    'exam_name' => $attempt->exam->name,
                    'score' => $attempt->score,
                    'total_score' => $attempt->total_score,
                    'percentage' => $attempt->total_score > 0
                        ? round(($attempt->score / $attempt->total_score) * 100, 2)
                        : 0,
                    'passed' => $attempt->score >= $passingScore,
                    'completed_at' => $attempt->completed_at->format('M d, Y H:i'),
                ];
            });

        // Exam Performance (top 5 exams by attempts)
        $examPerformance = Exam::with('attempts')
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function ($exam) {
                $attempts = $exam->attempts;
                $passed = 0;
                foreach ($attempts as $attempt) {
                    $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
                    if ($attempt->score >= $passingScore) {
                        $passed++;
                    }
                }
                return [
                    'name' => $exam->name,
                    'total_attempts' => $attempts->count(),
                    'passed' => $passed,
                    'failed' => $attempts->count() - $passed,
                    'pass_rate' => $attempts->count() > 0
                        ? round(($passed / $attempts->count()) * 100, 2)
                        : 0,
                ];
            });

        // Student Activity (students with most exams)
        $studentActivity = User::where('role', 'student')
            ->with('attempts')
            ->get()
            ->map(function ($student) {
                $attempts = $student->attempts;
                $passed = 0;
                foreach ($attempts as $attempt) {
                    $passingScore = $student->major->minimum_passing_grade ?? 0;
                    if ($attempt->score >= $passingScore) {
                        $passed++;
                    }
                }
                return [
                    'name' => $student->name,
                    'email' => $student->email,
                    'total_exams' => $attempts->count(),
                    'passed' => $passed,
                    'failed' => $attempts->count() - $passed,
                ];
            })
            ->sortByDesc('total_exams')
            ->take(5)
            ->values();

        return Inertia::render('admin/AdminDashboard', [
            'statistics' => [
                'users' => [
                    'total' => $totalUsers,
                    'students' => $totalStudents,
                    'teachers' => $totalTeachers,
                    'admins' => $totalAdmins,
                ],
                'exams' => [
                    'total' => $totalExams,
                    'published' => $publishedExams,
                    'draft' => $draftExams,
                ],
                'attempts' => [
                    'total' => $totalAttempts,
                    'completed' => $completedAttempts,
                    'in_progress' => $inProgressAttempts,
                    'passed' => $passedAttempts,
                    'failed' => $failedAttempts,
                ],
                'questions' => [
                    'total' => $totalQuestions,
                    'banks' => $totalQuestionBanks,
                ],
                'average_score' => $averageScore,
            ],
            'recent_attempts' => $recentAttempts,
            'exam_performance' => $examPerformance,
            'student_activity' => $studentActivity,
        ]);
    }
}
