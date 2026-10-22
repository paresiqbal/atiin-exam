<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        // Detect owner columns safely (so no "unknown column" 500)
        $examOwnerColumn = $this->detectOwnerColumn('exams', ['teacher_id', 'user_id', 'created_by']);
        $bankOwnerColumn = $this->detectOwnerColumn('question_banks', ['teacher_id', 'user_id', 'created_by']);
        $questionOwnerColumn = $this->detectOwnerColumn('questions', ['teacher_id', 'user_id', 'created_by']);

        // ---- Exams stats (teacher scoped)
        $examsQuery = DB::table('exams');
        if ($examOwnerColumn) {
            $examsQuery->where("exams.$examOwnerColumn", $teacherId);
        } else {
            // If we can't detect an owner column, we can't scope correctly.
            // Keep it empty rather than crashing.
            $examsQuery->whereRaw('1=0');
        }

        $totalExams = (clone $examsQuery)->count();
        $publishedExams = (clone $examsQuery)->where('is_published', true)->count();
        $draftExams = (clone $examsQuery)->where('is_published', false)->count();

        // ---- Attempts stats (attempts for teacher's exams)
        $attemptsBase = DB::table('exam_attempts')
            ->join('exams', 'exams.id', '=', 'exam_attempts.exam_id');

        if ($examOwnerColumn) {
            $attemptsBase->where("exams.$examOwnerColumn", $teacherId);
        } else {
            $attemptsBase->whereRaw('1=0');
        }

        $totalAttempts = (clone $attemptsBase)->count();
        $completedAttempts = (clone $attemptsBase)->where('exam_attempts.status', 'submitted')->count();
        $inProgressAttempts = (clone $attemptsBase)->where('exam_attempts.status', 'in_progress')->count();

        $teacherExamIds = (clone $examsQuery)->pluck('exams.id');
        $irtSubmittedAttempts = ExamAttempt::with(['exam', 'student.major'])
            ->whereIn('exam_id', $teacherExamIds)
            ->where('status', 'submitted')
            ->get()
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->exam->type->usesIrt());
        $passedAttempts = $irtSubmittedAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === true)
            ->count();
        $gradedAttempts = $irtSubmittedAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() !== null)
            ->count();
        $failedAttempts = $irtSubmittedAttempts
            ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === false)
            ->count();

        // Average score (submitted only)
        $averageScore = $completedAttempts > 0
            ? round((float) (clone $attemptsBase)->where('exam_attempts.status', 'submitted')->avg('exam_attempts.score'), 2)
            : 0;

        // ---- Question stats (teacher scoped)
        $totalQuestionBanks = 0;
        if ($bankOwnerColumn && Schema::hasTable('question_banks')) {
            $totalQuestionBanks = DB::table('question_banks')
                ->where($bankOwnerColumn, $teacherId)
                ->count();
        }

        $totalQuestions = 0;
        if ($questionOwnerColumn && Schema::hasTable('questions')) {
            // If questions table has owner column, use it
            $totalQuestions = DB::table('questions')
                ->where($questionOwnerColumn, $teacherId)
                ->count();
        } elseif (Schema::hasTable('questions') && Schema::hasTable('question_banks') && $bankOwnerColumn && Schema::hasColumn('questions', 'question_bank_id')) {
            // Fallback: scope questions via teacher's banks
            $totalQuestions = DB::table('questions')
                ->join('question_banks', 'question_banks.id', '=', 'questions.question_bank_id')
                ->where("question_banks.$bankOwnerColumn", $teacherId)
                ->count();
        }

        // ---- Recent attempts (last 5 submitted)
        $recentAttempts = ExamAttempt::with(['exam', 'student.major'])
            ->whereIn('exam_id', $teacherExamIds)
            ->where('status', 'submitted')
            ->orderByDesc('completed_at')
            ->limit(5)
            ->get()
            ->map(function (ExamAttempt $attempt) {
                $percentage = ((float) $attempt->total_score > 0)
                    ? round(((float) $attempt->score / (float) $attempt->total_score) * 100, 2)
                    : 0;

                return [
                    'id' => $attempt->id,
                    'student_name' => $attempt->student?->name ?? '-',
                    'exam_name' => $attempt->exam?->name ?? '-',
                    'score' => (float) $attempt->score,
                    'total_score' => (float) $attempt->total_score,
                    'percentage' => $percentage,
                    'exam_type' => $attempt->exam?->type?->value,
                    'irt_theta' => $attempt->irt_theta !== null ? (float) $attempt->irt_theta : null,
                    'passed' => $attempt->isPassed(),
                    'completed_at' => $attempt->completed_at?->format('M d, Y H:i'),
                ];
            });

        // ---- Exam performance (top 5 latest exams)
        $examsTop = (clone $examsQuery)
            ->orderByDesc('created_at')
            ->limit(5)
            ->select(['exams.id', 'exams.name', 'exams.type'])
            ->get();

        $examPerformance = $examsTop->map(function ($exam) {
            $attempts = ExamAttempt::with(['exam', 'student.major'])
                ->where('exam_id', $exam->id)
                ->get();

            $submitted = $attempts->where('status', 'submitted');
            $usesIrt = $exam->type->usesIrt();
            $graded = $submitted->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() !== null);
            $passed = $graded->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === true)->count();
            $failed = $graded->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === false)->count();
            $passRate = $usesIrt && $graded->isNotEmpty()
                ? round(($passed / $graded->count()) * 100, 2)
                : null;

            return [
                'name' => $exam->name,
                'type' => $exam->type,
                'total_attempts' => $attempts->count(),
                'passed' => $usesIrt ? $passed : null,
                'failed' => $usesIrt ? $failed : null,
                'pass_rate' => $passRate,
            ];
        })->values();

        // ---- Student activity (top 5 by attempts count across teacher exams)
        $studentActivity = (clone $attemptsBase)
            ->leftJoin('users as students', 'students.id', '=', 'exam_attempts.student_id')
            ->select([
                'students.id as student_id',
                'students.name',
                'students.email',
                'students.major_id',
                DB::raw('COUNT(*) as total_exams'),
            ])
            ->groupBy('students.id', 'students.name', 'students.email', 'students.major_id')
            ->orderByDesc('total_exams')
            ->limit(5)
            ->get()
            ->map(function ($s) use ($teacherExamIds) {
                $submitted = ExamAttempt::with(['exam', 'student.major'])
                    ->whereIn('exam_id', $teacherExamIds)
                    ->where('student_id', $s->student_id)
                    ->where('status', 'submitted')
                    ->get()
                    ->filter(fn (ExamAttempt $attempt): bool => $attempt->exam->type->usesIrt());
                $passed = $submitted
                    ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === true)
                    ->count();
                $failed = $submitted
                    ->filter(fn (ExamAttempt $attempt): bool => $attempt->isPassed() === false)
                    ->count();

                return [
                    'name' => $s->name ?? '-',
                    'email' => $s->email ?? '-',
                    'total_exams' => (int) $s->total_exams,
                    'passed' => $passed,
                    'failed' => $failed,
                ];
            })
            ->values();

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
                    'graded' => $gradedAttempts,
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

    private function detectOwnerColumn(string $table, array $candidates): ?string
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        foreach ($candidates as $col) {
            if (Schema::hasColumn($table, $col)) {
                return $col;
            }
        }

        return null;
    }
}
