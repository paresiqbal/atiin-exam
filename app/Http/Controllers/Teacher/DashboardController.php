<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionBank;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $teacher = $request->user();
        $totalExams = Exam::where('teacher_id', $teacher->id)->count();
        $publishedExams = Exam::where('teacher_id', $teacher->id)->where('is_published', true)->count();
        $draftExams = Exam::where('teacher_id', $teacher->id)->where('is_published', false)->count();

        // Attempt Statistics (attempts for teacher’s exams)
        $totalAttempts = ExamAttempt::whereHas('exam', function ($q) use ($teacher) {
            $q->where('teacher_id', $teacher->id);
        })->count();

        $completedAttempts = ExamAttempt::where('status', 'submitted')
            ->whereHas('exam', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->count();

        $inProgressAttempts = ExamAttempt::where('status', 'in_progress')
            ->whereHas('exam', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->count();

        // Calculate pass/fail (teacher’s submitted attempts)
        $submittedAttempts = ExamAttempt::with(['student.major', 'exam'])
            ->where('status', 'submitted')
            ->whereHas('exam', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->get();

        $passedAttempts = 0;
        foreach ($submittedAttempts as $attempt) {
            $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
            if ($attempt->score >= $passingScore) {
                $passedAttempts++;
            }
        }
        $failedAttempts = $completedAttempts - $passedAttempts;

        // Question Statistics (teacher only)
        $totalQuestionBanks = QuestionBank::where('teacher_id', $teacher->id)->count();

        // If questions are linked to teacher directly:
        $totalQuestions = Question::where('teacher_id', $teacher->id)->count();

        // If your questions don’t have teacher_id and only belong to question banks, use this instead:
        // $bankIds = QuestionBank::where('teacher_id', $teacher->id)->pluck('id');
        // $totalQuestions = Question::whereIn('question_bank_id', $bankIds)->count();

        // Average Score (teacher’s submitted attempts)
        $averageScore = $completedAttempts > 0
            ? round(
                ExamAttempt::where('status', 'submitted')
                    ->whereHas('exam', function ($q) use ($teacher) {
                        $q->where('teacher_id', $teacher->id);
                    })
                    ->avg('score'),
                2
            )
            : 0;

        // Recent Attempts (last 5 submitted for teacher’s exams)
        $recentAttempts = ExamAttempt::with(['student.major', 'exam'])
            ->where('status', 'submitted')
            ->whereHas('exam', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
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
                    'completed_at' => optional($attempt->completed_at)->format('M d, Y H:i'),
                ];
            });

        // Exam Performance (top 5 teacher exams by latest created_at, same as admin)
        $examPerformance = Exam::with(['attempts.student.major'])
            ->where('teacher_id', $teacher->id)
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function ($exam) {
                $attempts = $exam->attempts;

                $passed = 0;
                foreach ($attempts->where('status', 'submitted') as $attempt) {
                    $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
                    if ($attempt->score >= $passingScore) {
                        $passed++;
                    }
                }

                $totalSubmitted = $attempts->where('status', 'submitted')->count();
                $failed = $totalSubmitted - $passed;

                return [
                    'name' => $exam->name,
                    'total_attempts' => $attempts->count(),
                    'passed' => $passed,
                    'failed' => $failed,
                    'pass_rate' => $totalSubmitted > 0
                        ? round(($passed / $totalSubmitted) * 100, 2)
                        : 0,
                ];
            });

        // Student Activity (top 5 students by attempts on teacher’s exams)
        $studentActivity = ExamAttempt::with(['student.major'])
            ->whereHas('exam', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->get()
            ->groupBy('student_id')
            ->map(function ($attempts) {
                $student = $attempts->first()->student;

                $passed = 0;
                foreach ($attempts->where('status', 'submitted') as $attempt) {
                    $passingScore = $student->major->minimum_passing_grade ?? 0;
                    if ($attempt->score >= $passingScore) {
                        $passed++;
                    }
                }

                $total = $attempts->count();
                $failed = $attempts->where('status', 'submitted')->count() - $passed;

                return [
                    'name' => $student->name,
                    'email' => $student->email,
                    'total_exams' => $total,
                    'passed' => $passed,
                    'failed' => $failed,
                ];
            })
            ->sortByDesc('total_exams')
            ->take(5)
            ->values();

        // Return same prop structure (so FE can mirror admin)
        return Inertia::render('teacher/TeacherDashboard', [
            'statistics' => [
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
