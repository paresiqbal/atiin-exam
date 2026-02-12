<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ExamResultsExport;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamSetting;
use App\Models\ExamToken;
use App\Models\QuestionBank;
use App\Models\School;
use App\Models\User;
use App\Services\ExamResultsPdfService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);

        $exams = Exam::query()
            ->with([
                'questionBanks:id,name',
            ])
            ->withCount('attempts')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return Inertia::render('admin/exams/IndexExam', [
            'exams' => $exams,
        ]);
    }

    public function create()
    {
        $questionBanks = QuestionBank::withCount('questions')
            ->orderBy('name')
            ->get(['id', 'name']);

        $schools = School::orderBy('name')
            ->get(['id', 'name']);

        $classes = User::where('role', 'student')
            ->whereNotNull('class')
            ->distinct()
            ->orderBy('class')
            ->pluck('class');

        return Inertia::render('admin/exams/CreateExam', [
            'questionBanks' => $questionBanks,
            'schools'       => $schools,
            'classes'       => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after_or_equal:start_at',
            'shuffle_questions' => 'boolean',
            'allow_review' => 'boolean',
            'school_id' => 'required|exists:schools,id',

            'question_banks' => 'required|array|min:1',
            'question_banks.*.id' => 'required|integer|exists:question_banks,id',
            'question_banks.*.duration_minutes' => 'required|integer|min:1|max:300',
            'question_banks.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $admin = auth()->user();

        $exam = Exam::create([
            'admin_id'     => $admin->id,
            'school_id'    => $validated['school_id'],
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'start_at'     => $validated['start_at'],
            'end_at'       => $validated['end_at'],
            'is_published' => false,
        ]);

        $syncData = [];
        $totalMinutes = 0;

        foreach ($validated['question_banks'] as $i => $qb) {
            $minutes = (int) $qb['duration_minutes'];
            $totalMinutes += $minutes;

            $syncData[$qb['id']] = [
                'duration_minutes' => $minutes,
                'sort_order' => (int) ($qb['sort_order'] ?? ($i + 1)),
            ];
        }

        $exam->questionBanks()->sync($syncData);

        ExamSetting::create([
            'exam_id'            => $exam->id,
            'time_limit_minutes' => $totalMinutes,
            'shuffle_questions'  => $validated['shuffle_questions'] ?? true,
            'allow_review'       => $validated['allow_review'] ?? true,
            'max_attempts'       => 1,
        ]);

        ExamToken::create([
            'exam_id' => $exam->id,
            'token'   => strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6)),
        ]);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Exam created successfully');
    }

    public function show(Exam $exam): Response
    {
        $exam->load([
            'questionBanks' => function ($q) {
                $q->withPivot(['duration_minutes', 'sort_order'])
                    ->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions.options',
            'settings',
            'tokens',
            'school',
        ])->loadCount('attempts');

        return Inertia::render('admin/exams/ShowExam', [
            'exam' => $exam,
        ]);
    }

    public function regenerateToken(Exam $exam)
    {
        if ($exam->admin_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $exam->tokens()->delete();

        ExamToken::create([
            'exam_id' => $exam->id,
            'token'   => strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6)),
        ]);

        return back()->with('success', 'Token regenerated successfully');
    }

    public function edit(Exam $exam): Response
    {
        if ($exam->admin_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $exam->load([
            'school:id,name',
            'settings:exam_id,time_limit_minutes,shuffle_questions,allow_review,max_attempts',
            'questionBanks' => function ($q) {
                $q->select('question_banks.id', 'question_banks.name')
                    ->withPivot(['duration_minutes', 'sort_order'])
                    ->orderBy('exam_question_bank.sort_order');
            },
        ]);

        $questionBanks = QuestionBank::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $schools = School::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/exams/EditExam', [
            'exam' => $exam,
            'questionBanks' => $questionBanks,
            'schools' => $schools,
        ]);
    }

    public function update(Request $request, Exam $exam)
    {
        if ($exam->admin_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_at' => ['required', 'date'],
            'end_at'   => ['required', 'date', 'after_or_equal:start_at'],
            'shuffle_questions' => ['boolean'],
            'allow_review' => ['boolean'],
            'school_id' => ['required', 'exists:schools,id'],

            'question_banks' => ['required', 'array', 'min:1'],
            'question_banks.*.id' => ['required', 'integer', 'exists:question_banks,id'],
            'question_banks.*.duration_minutes' => ['required', 'integer', 'min:1', 'max:300'],
            'question_banks.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $exam->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'start_at'    => $validated['start_at'],
            'end_at'      => $validated['end_at'],
            'school_id'   => $validated['school_id'],
        ]);

        $syncData = [];
        $totalMinutes = 0;

        foreach ($validated['question_banks'] as $i => $qb) {
            $minutes = (int) $qb['duration_minutes'];
            $totalMinutes += $minutes;

            $syncData[$qb['id']] = [
                'duration_minutes' => $minutes,
                'sort_order' => (int) ($qb['sort_order'] ?? ($i + 1)),
            ];
        }

        $exam->questionBanks()->sync($syncData);

        $exam->settings()->update([
            'time_limit_minutes' => $totalMinutes,
            'shuffle_questions'  => $validated['shuffle_questions'] ?? true,
            'allow_review'       => $validated['allow_review'] ?? true,
        ]);

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Exam updated successfully');
    }

    public function destroy(Exam $exam)
    {
        if ($exam->attempts()->exists()) {
            return back()->with('error', 'Cannot delete exam that has been taken by students');
        }

        $exam->delete();

        return redirect()
            ->route('admin.exams.index')
            ->with('success', 'Exam deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.exams.index')
                ->with('info', 'Tidak ada ujian yang dipilih untuk dihapus.');
        }

        $examsWithAttempts = Exam::whereIn('id', $ids)
            ->whereHas('attempts')
            ->get();

        $deletableIds = Exam::whereIn('id', $ids)
            ->whereDoesntHave('attempts')
            ->pluck('id')
            ->all();

        if (! empty($deletableIds)) {
            Exam::whereIn('id', $deletableIds)->delete();
        }

        $deletedCount = count($deletableIds);
        $blockedCount = $examsWithAttempts->count();

        if ($deletedCount === 0 && $blockedCount > 0) {
            return redirect()
                ->route('admin.exams.index')
                ->with('warning', 'Tidak ada ujian yang dihapus karena semua ujian sudah pernah dikerjakan siswa.');
        }

        if ($blockedCount > 0) {
            $blockedNames = $examsWithAttempts->pluck('name')->join(', ');

            return redirect()
                ->route('admin.exams.index')
                ->with(
                    'warning',
                    "Sebanyak {$deletedCount} ujian berhasil dihapus. " .
                        "Beberapa ujian tidak dapat dihapus karena sudah pernah dikerjakan siswa: {$blockedNames}."
                );
        }

        return redirect()
            ->route('admin.exams.index')
            ->with('success', "Sebanyak {$deletedCount} ujian berhasil dihapus.");
    }

    public function publish(Exam $exam)
    {
        $exam->update(['is_published' => true]);

        return back()->with('success', 'Exam published successfully');
    }

    public function attempts(Exam $exam)
    {
        $totalQuestions = $this->getExamQuestions($exam)->count();
        $questionBankCount = $exam->questionBanks()->count();
        $bankDivisor = $questionBankCount > 0 ? $questionBankCount : 1;

        $attemptsQuery = $exam->attempts()
            ->with(['student.university', 'student.major'])
            ->orderByDesc('started_at');

        $attempts = $attemptsQuery->paginate(15);

        $attemptsTransformed = $attempts->through(function (ExamAttempt $attempt) use ($totalQuestions, $questionBankCount, $bankDivisor) {
            $score      = (float) ($attempt->score ?? 0);
            $totalScore = (float) ($attempt->total_score ?? 0);
            $adjustedScore = $score / $bankDivisor;
            $adjustedTotalScore = $totalScore / $bankDivisor;

            $percentage = ($totalQuestions > 0 && $attempt->status === 'submitted')
                ? round(($score / $totalQuestions) * 100, 2)
                : 0;

            $minPassing = $attempt->student->major->minimum_passing_grade ?? 0;

            $isPassed   = $attempt->status === 'submitted'
                ? $score >= $minPassing
                : false;

            return [
                'id'           => $attempt->id,
                'score'        => $score,
                'total_score'  => $totalScore,
                'adjusted_score' => (int) floor($adjustedScore),
                'adjusted_total_score' => (int) floor($adjustedTotalScore),
                'total_questions' => $totalQuestions,
                'question_bank_count' => $questionBankCount,
                'percentage'   => $percentage,
                'is_passed'    => $isPassed,
                'status'       => $attempt->status,
                'is_frozen'    => (bool) $attempt->is_frozen,
                'started_at'   => optional($attempt->started_at)->toIso8601String(),
                'completed_at' => optional($attempt->completed_at)->toIso8601String(),
                'student'      => [
                    'id'    => $attempt->student->id,
                    'name'  => $attempt->student->name,
                    'email' => $attempt->student->email,
                    'university' => [
                        'name' => $attempt->student->university->name ?? '-',
                    ],
                    'major' => [
                        'name'                  => $attempt->student->major->name ?? '-',
                        'minimum_passing_grade' => $minPassing,
                    ],
                ],
            ];
        });

        $submittedAttempts = $exam->attempts()
            ->where('status', 'submitted')
            ->get();

        $totalAttempts = $submittedAttempts->count();

        $passed = $submittedAttempts
            ->filter(function ($attempt) {
                $minPassing = $attempt->student->major->minimum_passing_grade ?? 0;
                return $attempt->score >= $minPassing;
            })
            ->count();

        $averagePercentage = $totalQuestions > 0
            ? ($submittedAttempts
                ->map(fn($a) => ((float) ($a->score ?? 0) / $totalQuestions) * 100)
                ->avg() ?? 0)
            : 0;

        return Inertia::render('admin/exams/ExamAttempts', [
            'exam' => [
                'id'   => $exam->id,
                'name' => $exam->name,
            ],
            'attempts' => $attemptsTransformed,
            'analytics' => [
                'total_attempts' => $totalAttempts,
                'passed'         => $passed,
                'average_score'  => round($averagePercentage, 2),
            ],
        ]);
    }

    /**
     * ✅ FIX: Exam has MANY question banks (questionBanks), not single questionBank
     * This helper flattens all questions across banks in pivot sort_order order.
     */
    private function getExamQuestions(Exam $exam): Collection
    {
        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions.options',
        ]);

        return $exam->questionBanks
            ->flatMap(fn($qb) => $qb->questions->sortBy('id'))
            ->unique('id')
            ->values();
    }

    public function attemptDetail(ExamAttempt $attempt)
    {
        $attempt->load([
            'student.university',
            'student.major',
            'exam.questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'exam.questionBanks.questions.options',
            'responses.selectedOption',
        ]);

        $passingScore = $attempt->student?->major?->minimum_passing_grade ?? 0;
        $isPassed = (float)($attempt->score ?? 0) >= (float)$passingScore;

        $questions = $this->getExamQuestions($attempt->exam);

        $questionDetails = $questions->map(function ($question) use ($attempt) {
            $response = $attempt->responses->firstWhere('question_id', $question->id);
            $selected = $response?->selectedOption;

            // single-correct assumption
            $correctOption = $question->options->firstWhere('is_correct', true);

            return [
                'id'            => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'points'        => $question->points,
                'student_answer' => $selected?->option_text,
                'correct_answer' => $correctOption?->option_text,
                'is_correct'    => (bool)($selected?->is_correct ?? false),
                'points_earned' => $response
                    ? ((bool)($selected?->is_correct ?? false) ? $question->points : 0)
                    : 0,
            ];
        });

        $allAttempts = $attempt->exam->attempts()
            ->with(['responses.selectedOption'])
            ->get();

        $questionPerformance = $allAttempts
            ->flatMap(fn($att) => $att->responses)
            ->groupBy('question_id')
            ->map(function ($responses) {
                $total = $responses->count();
                $correct = $responses->filter(fn($r) => (bool)($r->selectedOption?->is_correct ?? false))->count();

                return [
                    'total'      => $total,
                    'correct'    => $correct,
                    'percentage' => $total > 0 ? ($correct / $total) * 100 : 0,
                ];
            });

        return Inertia::render('admin/exams/AttemptDetail', [
            'attempt' => $attempt,
            'exam' => $attempt->exam,
            'student' => $attempt->student,
            'questionBankCount' => $attempt->exam->questionBanks->count(),
            'passingScore' => $passingScore,
            'isPassed' => $isPassed,
            'questionDetails' => $questionDetails,
            'questionPerformance' => $questionPerformance,
        ]);
    }

    public function exportResults(Exam $exam)
    {
        $attempts = $exam->attempts()
            ->with([
                'student.university',
                'student.major',
                'student.school',
                'responses.selectedOption',
            ])
            ->get();

        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions.options',
        ]);

        $banks = $exam->questionBanks->map(function ($bank, $index) {
            $questions = $bank->questions->unique('id')->values();
            return [
                'index' => $index + 1,
                'name' => $bank->name ?? 'Question Bank',
                'questions' => $questions,
            ];
        });

        $baseHeaders = ['Name', 'Email', 'School', 'Class', 'University', 'Major'];
        $headerRow1 = $baseHeaders;
        $headerRow2 = $baseHeaders;

        foreach ($banks as $bank) {
            $questions = $bank['questions'];
            $count = $questions->count();
            for ($i = 0; $i < $count; $i++) {
                $headerRow1[] = $i === 0
                    ? "Block {$bank['index']} - {$bank['name']}"
                    : '';
            }
            foreach ($questions as $question) {
                $headerRow2[] = "Q{$question->id}";
            }
        }

        $headerRow1[] = 'Total Score';
        $headerRow1[] = 'Status';
        $headerRow2[] = 'Total Score';
        $headerRow2[] = 'Status';

        $rows = [];
        $rows[] = $headerRow1;
        $rows[] = $headerRow2;

        foreach ($attempts as $attempt) {
            $student = $attempt->student;

            $row = [
                $student?->name ?? 'N/A',
                $student?->email ?? 'N/A',
                $student?->school?->name ?? 'N/A',
                $student?->class ?? 'N/A',
                $student?->university?->name ?? 'N/A',
                $student?->major?->name ?? 'N/A',
            ];

            $byQuestion = $attempt->responses->keyBy('question_id');

            foreach ($banks as $bank) {
                foreach ($bank['questions'] as $question) {
                    $response = $byQuestion->get($question->id);
                    $isCorrect = (bool)($response?->selectedOption?->is_correct ?? false);

                    $row[] = $isCorrect ? 'Correct' : 'Wrong';
                }
            }

            $row[] = "{$attempt->score}/{$attempt->total_score}";
            $passingScore = $student?->major?->minimum_passing_grade ?? 0;
            $row[] = ((float)($attempt->score ?? 0) >= (float)$passingScore) ? 'PASSED' : 'FAILED';

            $rows[] = $row;
        }

        $filename = 'exam-results-' . $exam->id . '-' . now()->format('Y-m-d') . '.csv';
        $handle = fopen('php://memory', 'w');

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"$filename\"");
    }

    public function downloadAttemptPdf(ExamAttempt $attempt)
    {
        $pdfService = new ExamResultsPdfService();
        $pdf = $pdfService->generate($attempt);

        return $pdf->download('exam-attempt-' . $attempt->id . '.pdf');
    }

    public function unfreezeAttempt(ExamAttempt $attempt)
    {
        $attempt->update([
            'is_frozen' => false,
            'frozen_at' => null,
            'frozen_reason' => null,
        ]);

        $attempt->violations()->delete();

        return back()->with('success', 'Ujian berhasil dibuka kembali untuk siswa.');
    }
}
