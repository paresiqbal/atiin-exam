<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
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

        // Pass/fail calculation (safe even if major/min grade is missing)
        $submitted = (clone $attemptsBase)
            ->leftJoin('users as students', 'students.id', '=', 'exam_attempts.student_id')
            ->leftJoin('majors', 'majors.id', '=', 'students.major_id')
            ->where('exam_attempts.status', 'submitted')
            ->select([
                'exam_attempts.score',
                DB::raw('COALESCE(majors.minimum_passing_grade, 0) as min_pass'),
            ])
            ->get();

        $passedAttempts = 0;
        foreach ($submitted as $row) {
            if ((float)$row->score >= (float)$row->min_pass) {
                $passedAttempts++;
            }
        }
        $failedAttempts = $completedAttempts - $passedAttempts;

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
        $recentAttempts = (clone $attemptsBase)
            ->leftJoin('users as students', 'students.id', '=', 'exam_attempts.student_id')
            ->where('exam_attempts.status', 'submitted')
            ->orderByDesc('exam_attempts.completed_at')
            ->limit(5)
            ->select([
                'exam_attempts.id',
                DB::raw('COALESCE(students.name, "-") as student_name'),
                DB::raw('COALESCE(exams.name, "-") as exam_name'),
                'exam_attempts.score',
                'exam_attempts.total_score',
                'exam_attempts.completed_at',
                'students.major_id',
            ])
            ->get()
            ->map(function ($row) {
                $percentage = ((float)$row->total_score > 0)
                    ? round(((float)$row->score / (float)$row->total_score) * 100, 2)
                    : 0;

                return [
                    'id' => (int) $row->id,
                    'student_name' => $row->student_name,
                    'exam_name' => $row->exam_name,
                    'score' => (float) $row->score,
                    'total_score' => (float) $row->total_score,
                    'percentage' => $percentage,
                    // we'll fill passed below safely (requires major min grade)
                    'passed' => false,
                    'completed_at' => $row->completed_at ? date('M d, Y H:i', strtotime($row->completed_at)) : null,
                    '_major_id' => $row->major_id, // internal temp
                ];
            });

        // Fill passed for recent attempts (safe lookup)
        $majorMin = [];
        if (Schema::hasTable('majors')) {
            $majorIds = $recentAttempts->pluck('_major_id')->filter()->unique()->values();
            if ($majorIds->count()) {
                $majorMin = DB::table('majors')
                    ->whereIn('id', $majorIds)
                    ->pluck('minimum_passing_grade', 'id')
                    ->toArray();
            }
        }

        $recentAttempts = $recentAttempts->map(function ($a) use ($majorMin) {
            $min = $a['_major_id'] ? ($majorMin[$a['_major_id']] ?? 0) : 0;
            $a['passed'] = ((float)$a['score'] >= (float)$min);
            unset($a['_major_id']);
            return $a;
        })->values();

        // ---- Exam performance (top 5 latest exams)
        $examsTop = (clone $examsQuery)
            ->orderByDesc('created_at')
            ->limit(5)
            ->select(['exams.id', 'exams.name'])
            ->get();

        $examPerformance = $examsTop->map(function ($exam) use ($attemptsBase) {
            $attempts = (clone $attemptsBase)
                ->where('exams.id', $exam->id)
                ->select(['exam_attempts.status', 'exam_attempts.score', 'exam_attempts.student_id'])
                ->get();

            // pass/fail only based on submitted attempts
            $submitted = $attempts->where('status', 'submitted');
            $submittedCount = $submitted->count();

            $studentIds = $submitted->pluck('student_id')->unique()->values();
            $minPassByStudent = [];

            if ($studentIds->count()) {
                $rows = DB::table('users as students')
                    ->leftJoin('majors', 'majors.id', '=', 'students.major_id')
                    ->whereIn('students.id', $studentIds)
                    ->select(['students.id', DB::raw('COALESCE(majors.minimum_passing_grade, 0) as min_pass')])
                    ->get();

                foreach ($rows as $r) {
                    $minPassByStudent[$r->id] = (float)$r->min_pass;
                }
            }

            $passed = 0;
            foreach ($submitted as $a) {
                $min = $minPassByStudent[$a->student_id] ?? 0;
                if ((float)$a->score >= (float)$min) $passed++;
            }

            $failed = $submittedCount - $passed;
            $passRate = $submittedCount > 0 ? round(($passed / $submittedCount) * 100, 2) : 0;

            return [
                'name' => $exam->name,
                'total_attempts' => $attempts->count(),
                'passed' => $passed,
                'failed' => $failed,
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
            ->map(function ($s) use ($attemptsBase) {
                // compute passed/failed for this student within teacher exams
                $submitted = (clone $attemptsBase)
                    ->where('exam_attempts.student_id', $s->student_id)
                    ->where('exam_attempts.status', 'submitted')
                    ->select(['exam_attempts.score'])
                    ->get();

                $minPass = 0;
                if ($s->major_id) {
                    $minPass = (float) (DB::table('majors')->where('id', $s->major_id)->value('minimum_passing_grade') ?? 0);
                }

                $passed = 0;
                foreach ($submitted as $a) {
                    if ((float)$a->score >= $minPass) $passed++;
                }

                $failed = $submitted->count() - $passed;

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
        if (!Schema::hasTable($table)) return null;

        foreach ($candidates as $col) {
            if (Schema::hasColumn($table, $col)) return $col;
        }

        return null;
    }
}
