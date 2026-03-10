<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Major;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ── User stats ────────────────────────────────────────────────────────
        $totalStudents = User::where('role', 'student')->count();
        $totalAdmins   = User::where('role', 'admin')->count();

        // ── Exam stats ────────────────────────────────────────────────────────
        $totalExams     = Exam::count();
        $publishedExams = Exam::where('is_published', true)->count();
        $draftExams     = Exam::where('is_published', false)->count();
        $irtProcessed   = Exam::whereNotNull('irt_processed_at')->count();

        // ── Attempt stats ─────────────────────────────────────────────────────
        $totalAttempts      = ExamAttempt::count();
        $completedAttempts  = ExamAttempt::where('status', 'submitted')->count();
        $inProgressAttempts = ExamAttempt::where('status', 'in_progress')->count();
        $frozenAttempts     = ExamAttempt::where('status', 'frozen')
            ->orWhere('is_frozen', true)->count();

        // Pass/fail using irt_block_score where available, otherwise score
        // Load only submitted attempts with student + major
        $submittedAttempts = ExamAttempt::where('status', 'submitted')
            ->with('student.major')
            ->get();

        $passedAttempts = 0;
        foreach ($submittedAttempts as $attempt) {
            // Use irt_block_score if processed, else raw score
            $effectiveScore = $attempt->irt_block_score ?? $attempt->score ?? 0;

            // Use university_selections for passing grade if set
            $selections    = $attempt->student->university_selections ?? [];
            $firstMajorId  = $selections[0]['majors'][0] ?? null;
            $passingScore  = $firstMajorId
                ? (Major::find($firstMajorId)?->minimum_passing_grade ?? 0)
                : ($attempt->student->major->minimum_passing_grade ?? 0);

            if ($effectiveScore >= $passingScore) {
                $passedAttempts++;
            }
        }
        $failedAttempts = $completedAttempts - $passedAttempts;

        // Average skor_utbk_pct across IRT-processed attempts
        $avgSkorUtbk = ExamAttempt::where('status', 'submitted')
            ->whereNotNull('irt_block_score')
            ->avg('irt_block_score') ?? 0;

        // ── Question stats ────────────────────────────────────────────────────
        $totalQuestions     = Question::count();
        $totalQuestionBanks = QuestionBank::count();

        // ── Recent attempts (last 6) ──────────────────────────────────────────
        $recentAttempts = ExamAttempt::with('student', 'exam')
            ->where('status', 'submitted')
            ->orderByDesc('completed_at')
            ->take(6)
            ->get()
            ->map(function ($attempt) {
                $selections   = $attempt->student->university_selections ?? [];
                $firstMajorId = $selections[0]['majors'][0] ?? null;
                $passingScore = $firstMajorId
                    ? (Major::find($firstMajorId)?->minimum_passing_grade ?? 0)
                    : ($attempt->student->major->minimum_passing_grade ?? 0);

                $skorUtbkPct  = $attempt->irt_block_score;
                $effectiveScore = $skorUtbkPct ?? $attempt->score ?? 0;
                $passed       = $effectiveScore >= $passingScore;

                return [
                    'id'           => $attempt->id,
                    'student_name' => $attempt->student->name,
                    'exam_name'    => $attempt->exam->name,
                    'skor_utbk_pct' => $skorUtbkPct !== null ? round($skorUtbkPct, 2) : null,
                    'irt_processed' => $skorUtbkPct !== null,
                    'passed'       => $passed,
                    'completed_at' => optional($attempt->completed_at)->format('d M Y, H:i'),
                ];
            });

        // ── Exam performance (5 most recent, IRT data preferred) ─────────────
        $examPerformance = Exam::withCount('attempts')
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function ($exam) {
                $attempts = $exam->attempts()
                    ->where('status', 'submitted')
                    ->with('student.major')
                    ->get();

                $passed = 0;
                $totalSkor = 0;
                $irtCount  = 0;

                foreach ($attempts as $attempt) {
                    $selections   = $attempt->student->university_selections ?? [];
                    $firstMajorId = $selections[0]['majors'][0] ?? null;
                    $passingScore = $firstMajorId
                        ? (Major::find($firstMajorId)?->minimum_passing_grade ?? 0)
                        : ($attempt->student->major->minimum_passing_grade ?? 0);

                    $effectiveScore = $attempt->irt_block_score ?? $attempt->score ?? 0;
                    if ($effectiveScore >= $passingScore) {
                        $passed++;
                    }

                    if ($attempt->irt_block_score !== null) {
                        $totalSkor += $attempt->irt_block_score;
                        $irtCount++;
                    }
                }

                $total   = $attempts->count();
                $avgSkor = $irtCount > 0 ? round($totalSkor / $irtCount, 2) : null;

                return [
                    'name'           => $exam->name,
                    'total_attempts' => $total,
                    'passed'         => $passed,
                    'failed'         => $total - $passed,
                    'pass_rate'      => $total > 0 ? round(($passed / $total) * 100, 1) : 0,
                    'avg_skor_utbk'  => $avgSkor,
                    'irt_processed'  => $exam->irt_processed_at !== null,
                ];
            });

        // ── Skor UTBK distribution buckets (for histogram) ───────────────────
        // Only from IRT-processed attempts
        $buckets = [
            '0–20'   => 0,
            '20–40'  => 0,
            '40–60'  => 0,
            '60–80'  => 0,
            '80–100' => 0,
        ];

        ExamAttempt::where('status', 'submitted')
            ->whereNotNull('irt_block_score')
            ->pluck('irt_block_score')
            ->each(function ($pct) use (&$buckets) {
                if ($pct < 20)  $buckets['0–20']++;
                elseif ($pct < 40)  $buckets['20–40']++;
                elseif ($pct < 60)  $buckets['40–60']++;
                elseif ($pct < 80)  $buckets['60–80']++;
                else                 $buckets['80–100']++;
            });

        $skorDistribution = collect($buckets)->map(fn($count, $range) => [
            'range' => $range,
            'count' => $count,
        ])->values();

        return Inertia::render('admin/AdminDashboard', [
            'statistics' => [
                'users' => [
                    'students' => $totalStudents,
                    'admins'   => $totalAdmins,
                    'total'    => $totalStudents + $totalAdmins,
                ],
                'exams' => [
                    'total'         => $totalExams,
                    'published'     => $publishedExams,
                    'draft'         => $draftExams,
                    'irt_processed' => $irtProcessed,
                ],
                'attempts' => [
                    'total'       => $totalAttempts,
                    'completed'   => $completedAttempts,
                    'in_progress' => $inProgressAttempts,
                    'frozen'      => $frozenAttempts,
                    'passed'      => $passedAttempts,
                    'failed'      => $failedAttempts,
                ],
                'questions' => [
                    'total' => $totalQuestions,
                    'banks' => $totalQuestionBanks,
                ],
                'avg_skor_utbk' => round($avgSkorUtbk, 2),
            ],
            'recent_attempts'   => $recentAttempts,
            'exam_performance'  => $examPerformance,
            'skor_distribution' => $skorDistribution,
        ]);
    }
}
