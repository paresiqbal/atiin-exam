<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ExamType;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ── User stats ────────────────────────────────────────────────────────
        $totalStudents = User::where('role', 'student')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        // ── Exam stats ────────────────────────────────────────────────────────
        $totalExams = Exam::count();
        $publishedExams = Exam::where('is_published', true)->count();
        $draftExams = Exam::where('is_published', false)->count();
        $irtTypeValues = collect(ExamType::cases())
            ->filter(fn (ExamType $type) => $type->usesIrt())
            ->map(fn (ExamType $type) => $type->value)
            ->all();
        $irtExamCount = Exam::whereIn('type', $irtTypeValues)->count();
        $irtProcessed = Exam::whereIn('type', $irtTypeValues)
            ->whereNotNull('irt_processed_at')
            ->count();

        // ── Attempt stats ─────────────────────────────────────────────────────
        $totalAttempts = ExamAttempt::count();
        $completedAttempts = ExamAttempt::where('status', 'submitted')->count();
        $inProgressAttempts = ExamAttempt::where('status', 'in_progress')->count();
        $frozenAttempts = ExamAttempt::where('status', 'frozen')
            ->orWhere('is_frozen', true)->count();

        $submittedAttempts = ExamAttempt::where('status', 'submitted')
            ->with('student.major', 'exam')
            ->get();

        $irtAttempts = $submittedAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->exam?->type->usesIrt() ?? false);
        $passedAttempts = $irtAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === true)
            ->count();
        $gradedAttempts = $irtAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() !== null)
            ->count();
        $failedAttempts = $irtAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === false)
            ->count();

        $avgSkorIrt = ExamAttempt::where('status', 'submitted')
            ->whereNotNull('irt_block_score')
            ->whereHas('exam', fn ($query) => $query->whereIn('type', $irtTypeValues))
            ->avg('irt_block_score') ?? 0;

        // ── Question stats ────────────────────────────────────────────────────
        $totalQuestions = Question::count();
        $totalQuestionBanks = QuestionBank::count();

        // ── Recent attempts (last 6) ──────────────────────────────────────────
        $recentAttempts = ExamAttempt::with('student', 'student.major', 'exam')
            ->where('status', 'submitted')
            ->orderByDesc('completed_at')
            ->take(6)
            ->get()
            ->map(function (ExamAttempt $attempt) {
                $usesIrt = $attempt->exam?->type?->usesIrt() ?? false;
                $skorUtbkPct = $attempt->irt_block_score;

                return [
                    'id' => $attempt->id,
                    'student_name' => $attempt->student->name,
                    'exam_name' => $attempt->exam->name,
                    'raw_score' => $attempt->score,
                    'total_score' => $attempt->total_score,
                    'percentage' => $attempt->exam->type === ExamType::CBT
                        ? ((float) ($attempt->total_score ?? 0) > 0
                            ? round(((float) ($attempt->score ?? 0) / (float) $attempt->total_score) * 100, 2)
                            : 0)
                        : null,
                    'skor_utbk_pct' => $skorUtbkPct !== null ? round($skorUtbkPct, 2) : null,
                    'exam_type' => $attempt->exam->type->value,
                    'uses_irt' => $usesIrt,
                    'irt_processed' => $usesIrt && $attempt->exam->irt_processed_at !== null && $skorUtbkPct !== null,
                    'passed' => $attempt->isPassed(),
                    'completed_at' => optional($attempt->completed_at)->format('d M Y, H:i'),
                ];
            });

        // ── Exam performance (5 most recent, IRT data preferred) ─────────────
        $examPerformance = Exam::withCount('attempts')
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function (Exam $exam) {
                $attempts = $exam->attempts()
                    ->where('status', 'submitted')
                    ->with('student.major')
                    ->get();

                $passed = 0;
                $totalSkor = 0;
                $irtCount = 0;
                $usesIrt = $exam->type->usesIrt();

                foreach ($attempts as $attempt) {
                    if ($attempt->isPassed() === true) {
                        $passed++;
                    }

                    if ($usesIrt && $attempt->irt_block_score !== null) {
                        $totalSkor += $attempt->irt_block_score;
                        $irtCount++;
                    }
                }

                $total = $attempts->count();
                $graded = $attempts->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() !== null)->count();
                $avgSkorIrt = $irtCount > 0 ? round($totalSkor / $irtCount, 2) : null;

                return [
                    'name' => $exam->name,
                    'type' => $exam->type->value,
                    'total_attempts' => $total,
                    'passed' => $usesIrt ? $passed : null,
                    'failed' => $usesIrt
                        ? $attempts->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === false)->count()
                        : null,
                    'pass_rate' => $usesIrt && $graded > 0
                        ? round(($passed / $graded) * 100, 1)
                        : null,
                    'avg_skor_irt' => $avgSkorIrt,
                    'irt_processed' => $usesIrt && $exam->irt_processed_at !== null,
                ];
            });

        // ── Skor UTBK distribution buckets (for histogram) ───────────────────
        // Only from IRT-processed attempts
        $buckets = [
            '0–20' => 0,
            '20–40' => 0,
            '40–60' => 0,
            '60–80' => 0,
            '80–100' => 0,
        ];

        ExamAttempt::where('status', 'submitted')
            ->whereNotNull('irt_block_score')
            ->whereHas('exam', fn ($query) => $query->whereIn('type', $irtTypeValues))
            ->pluck('irt_block_score')
            ->each(function ($pct) use (&$buckets) {
                if ($pct < 20) {
                    $buckets['0–20']++;
                } elseif ($pct < 40) {
                    $buckets['20–40']++;
                } elseif ($pct < 60) {
                    $buckets['40–60']++;
                } elseif ($pct < 80) {
                    $buckets['60–80']++;
                } else {
                    $buckets['80–100']++;
                }
            });

        $skorDistribution = collect($buckets)->map(fn ($count, $range) => [
            'range' => $range,
            'count' => $count,
        ])->values();

        return Inertia::render('admin/AdminDashboard', [
            'statistics' => [
                'users' => [
                    'students' => $totalStudents,
                    'admins' => $totalAdmins,
                    'total' => $totalStudents + $totalAdmins,
                ],
                'exams' => [
                    'total' => $totalExams,
                    'published' => $publishedExams,
                    'draft' => $draftExams,
                    'irt_processed' => $irtProcessed,
                    'irt_eligible' => $irtExamCount,
                ],
                'attempts' => [
                    'total' => $totalAttempts,
                    'completed' => $completedAttempts,
                    'graded' => $gradedAttempts,
                    'in_progress' => $inProgressAttempts,
                    'frozen' => $frozenAttempts,
                    'passed' => $passedAttempts,
                    'failed' => $failedAttempts,
                ],
                'questions' => [
                    'total' => $totalQuestions,
                    'banks' => $totalQuestionBanks,
                ],
                'avg_skor_irt' => round($avgSkorIrt, 2),
            ],
            'recent_attempts' => $recentAttempts,
            'exam_performance' => $examPerformance,
            'skor_distribution' => $skorDistribution,
        ]);
    }
}
