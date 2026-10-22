<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ExamType;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamSetting;
use App\Models\ExamToken;
use App\Models\Major;
use App\Models\QuestionBank;
use App\Models\School;
use App\Models\University;
use App\Models\User;
use App\Services\ExamOfficialLetterPdfService;
use App\Services\ExamResultsPdfService;
use App\Services\IrtRaschService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    /**
     * irt_block_score stores skor_utbk_pct (percentage, e.g. 45.41).
     * minimum_passing_grade is on the raw UTBK scale (e.g. 651).
     * Use this constant to convert: skor_utbk_raw = pct * ATTIN_FORMULA / 100
     */
    private const ATTIN_FORMULA = 1525.0;

    private function requestedType(Request $request): ExamType
    {
        $type = $request->query('type', ExamType::UTBK->value);

        if (! is_string($type)) {
            abort(404);
        }

        return ExamType::tryFrom($type) ?? abort(404);
    }

    /**
     * Convert skor_utbk_pct → raw UTBK score (same scale as minimum_passing_grade).
     */
    private function pctToRaw(?float $pct): ?float
    {
        return $pct !== null
            ? round($pct * self::ATTIN_FORMULA / 100, 2)
            : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        $type = $this->requestedType($request);
        $search = trim((string) $request->input('search', ''));

        $exams = Exam::ofType($type)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhereHas('questionBanks', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->with(['questionBanks:id,name'])
            ->withCount('attempts')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/exams/IndexExam', [
            'exams' => $exams,
            'examType' => $type->value,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $type = $this->requestedType($request);
        $questionBanks = QuestionBank::withCount('questions')
            ->orderBy('name')
            ->get(['id', 'name']);

        $schools = School::orderBy('name')->get(['id', 'name']);

        $classes = User::where('role', 'student')
            ->whereNotNull('class')
            ->distinct()
            ->orderBy('class')
            ->pluck('class');

        return Inertia::render('admin/exams/CreateExam', [
            'questionBanks' => $questionBanks,
            'schools' => $schools,
            'classes' => $classes,
            'examType' => $type->value,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::enum(ExamType::class)],
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

        $exam = Exam::create([
            'admin_id' => auth()->id(),
            'school_id' => $validated['school_id'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
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
            'exam_id' => $exam->id,
            'time_limit_minutes' => $totalMinutes,
            'shuffle_questions' => $validated['shuffle_questions'] ?? true,
            'allow_review' => $validated['allow_review'] ?? true,
            'max_attempts' => 1,
        ]);

        ExamToken::create([
            'exam_id' => $exam->id,
            'token' => strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6)),
        ]);

        return redirect()
            ->route('admin.exams.index', ['type' => $exam->type->value])
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
            'token' => strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6)),
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
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'shuffle_questions' => ['boolean'],
            'allow_review' => ['boolean'],
            'school_id' => ['required', 'exists:schools,id'],
            'question_banks' => ['required', 'array', 'min:1'],
            'question_banks.*.id' => ['required', 'integer', 'exists:question_banks,id'],
            'question_banks.*.duration_minutes' => ['required', 'integer', 'min:1', 'max:300'],
            'question_banks.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $exam->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
            'school_id' => $validated['school_id'],
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
            'shuffle_questions' => $validated['shuffle_questions'] ?? true,
            'allow_review' => $validated['allow_review'] ?? true,
        ]);

        return redirect()
            ->route('admin.exams.index', ['type' => $exam->type->value])
            ->with('success', 'Exam updated successfully');
    }

    public function destroy(Exam $exam)
    {
        if ($exam->attempts()->exists()) {
            return back()->with('error', 'Cannot delete exam that has been taken by students');
        }

        $type = $exam->type;
        $exam->delete();

        return redirect()
            ->route('admin.exams.index', ['type' => $type->value])
            ->with('success', 'Exam deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $type = $this->requestedType($request);
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.exams.index', ['type' => $type->value])
                ->with('info', 'Tidak ada ujian yang dipilih untuk dihapus.');
        }

        $examsWithAttempts = Exam::ofType($type)->whereIn('id', $ids)
            ->whereHas('attempts')
            ->get();

        $deletableIds = Exam::ofType($type)->whereIn('id', $ids)
            ->whereDoesntHave('attempts')
            ->pluck('id')
            ->all();

        if (! empty($deletableIds)) {
            Exam::ofType($type)->whereIn('id', $deletableIds)->delete();
        }

        $deletedCount = count($deletableIds);
        $blockedCount = $examsWithAttempts->count();

        if ($deletedCount === 0 && $blockedCount > 0) {
            return redirect()
                ->route('admin.exams.index', ['type' => $type->value])
                ->with('warning', 'Tidak ada ujian yang dihapus karena semua ujian sudah pernah dikerjakan siswa.');
        }

        if ($blockedCount > 0) {
            $blockedNames = $examsWithAttempts->pluck('name')->join(', ');

            return redirect()
                ->route('admin.exams.index', ['type' => $type->value])
                ->with(
                    'warning',
                    "Sebanyak {$deletedCount} ujian berhasil dihapus. ".
                        "Beberapa ujian tidak dapat dihapus karena sudah pernah dikerjakan siswa: {$blockedNames}."
                );
        }

        return redirect()
            ->route('admin.exams.index', ['type' => $type->value])
            ->with('success', "Sebanyak {$deletedCount} ujian berhasil dihapus.");
    }

    public function publish(Exam $exam)
    {
        $exam->update(['is_published' => true]);

        return back()->with('success', 'Exam published successfully');
    }

    public function endNow(Exam $exam)
    {
        if ($exam->admin_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $exam->update(['end_at' => now()]);

        return back()->with('success', 'Exam ended successfully.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Attempts list
    // ─────────────────────────────────────────────────────────────────────────

    public function attempts(Exam $exam)
    {
        $totalQuestions = $this->getExamQuestions($exam)->count();
        $questionBankCount = $exam->questionBanks()->count();
        $bankDivisor = $questionBankCount > 0 ? $questionBankCount : 1;

        $perPage = (int) request()->input('per_page', 15);
        $q = request()->input('q');
        $status = request()->input('status');
        $sortBy = request()->input('sort_by', 'date');
        $sortDir = request()->input('sort_dir', 'desc');
        $freeze = request()->input('freeze', 'all');

        $attemptsQuery = $exam->attempts()
            ->select('exam_attempts.*')
            ->with(['student.university', 'student.major'])
            ->leftJoin('users as students', 'students.id', '=', 'exam_attempts.student_id')
            ->leftJoin('majors', 'majors.id', '=', 'students.major_id');

        if (! empty($q)) {
            $attemptsQuery->where(function ($sq) use ($q) {
                $sq->where('students.name', 'like', "%{$q}%")
                    ->orWhere('students.email', 'like', "%{$q}%");
            });
        }

        $isUtbk = $exam->type === ExamType::UTBK;
        $isCbt = $exam->type === ExamType::CBT;

        if ($isUtbk && $status === 'passed') {
            $attemptsQuery
                ->where('exam_attempts.status', 'submitted')
                ->whereNotNull('exam_attempts.irt_block_score')
                ->whereRaw(
                    '(exam_attempts.irt_block_score * ? / 100) >= COALESCE(majors.minimum_passing_grade, 0)',
                    [self::ATTIN_FORMULA]
                );
        }

        if ($isUtbk && $status === 'failed') {
            $attemptsQuery
                ->where('exam_attempts.status', 'submitted')
                ->where(function ($fq) {
                    $fq->whereNull('exam_attempts.irt_block_score')
                        ->orWhereRaw(
                            '(exam_attempts.irt_block_score * ? / 100) < COALESCE(majors.minimum_passing_grade, 0)',
                            [self::ATTIN_FORMULA]
                        );
                });
        }

        if ($freeze === 'frozen') {
            $attemptsQuery->where(function ($fq) {
                $fq->where('exam_attempts.is_frozen', true)
                    ->orWhere('exam_attempts.status', 'frozen');
            });
        }

        if ($freeze === 'not_frozen') {
            $attemptsQuery->where(function ($fq) {
                $fq->where(function ($nfq) {
                    $nfq->where('exam_attempts.is_frozen', false)
                        ->orWhereNull('exam_attempts.is_frozen');
                })->where('exam_attempts.status', '!=', 'frozen');
            });
        }

        if ($sortBy === 'name') {
            $attemptsQuery->orderBy('students.name', $sortDir);
        } elseif ($sortBy === 'score') {
            $attemptsQuery->orderBy(
                $isCbt ? 'exam_attempts.score' : 'exam_attempts.irt_block_score',
                $sortDir
            );
        } else {
            $attemptsQuery->orderBy('exam_attempts.started_at', $sortDir);
        }

        $attempts = $attemptsQuery->paginate($perPage)->withQueryString();

        $attemptsTransformed = $attempts->through(function (ExamAttempt $attempt) use (
            $totalQuestions,
            $questionBankCount,
            $bankDivisor,
            $isUtbk,
            $isCbt
        ) {
            $rawScore = (float) ($attempt->score ?? 0);
            $totalScore = (float) ($attempt->total_score ?? 0);
            $blockScore = $attempt->irt_block_score;   // pct, e.g. 45.41
            $scorePercentage = $totalScore > 0
                ? round(($rawScore / $totalScore) * 100, 2)
                : 0;

            // Convert to raw UTBK score for pass/fail comparison
            $skorUtbk = $this->pctToRaw($blockScore);   // e.g. 692.35
            $adjustedScore = $isCbt ? $rawScore : ($blockScore ?? ($rawScore / $bankDivisor));
            $adjustedTotalScore = $isCbt ? $totalScore : ($totalScore / $bankDivisor);

            $selections = $isUtbk ? ($attempt->student->university_selections ?? []) : [];
            $firstSelection = $selections[0] ?? null;
            $firstUniversityId = $firstSelection['university_id'] ?? null;
            $firstMajorId = $firstSelection['majors'][0] ?? null;

            $selectedUniversity = $firstUniversityId
                ? University::find($firstUniversityId)?->name
                : null;

            $selectedMajorModel = $firstMajorId
                ? Major::find($firstMajorId)
                : null;

            $selectedMajorName = $selectedMajorModel?->name;
            $minPassing = $isUtbk
                ? ($selectedMajorModel?->minimum_passing_grade
                    ?? $attempt->student->major?->minimum_passing_grade
                    ?? 0)
                : null;

            $isPassed = $isUtbk && $attempt->status === 'submitted' && $skorUtbk !== null
                ? $skorUtbk >= $minPassing
                : null;

            $durationMinutes = null;
            if ($attempt->started_at && $attempt->completed_at) {
                $durationMinutes = max(
                    0,
                    $attempt->completed_at->diffInMinutes($attempt->started_at)
                );
            }

            return [
                'id' => $attempt->id,
                'raw_score' => $attempt->score,
                'total_score' => $attempt->total_score,
                'skor_utbk_pct' => $blockScore,      // percentage — display only
                'skor_utbk' => $skorUtbk,        // raw — for comparisons
                'adjusted_score' => (int) floor($adjustedScore),
                'adjusted_total_score' => (int) floor($adjustedTotalScore),
                'score_percentage' => $isCbt ? $scorePercentage : null,
                'total_questions' => $totalQuestions,
                'question_bank_count' => $questionBankCount,
                'is_passed' => $isPassed,
                'status' => $attempt->status,
                'is_frozen' => (bool) $attempt->is_frozen,
                'duration_minutes' => $durationMinutes,
                'started_at' => optional($attempt->started_at)->toIso8601String(),
                'completed_at' => optional($attempt->completed_at)->toIso8601String(),
                'student' => [
                    'id' => $attempt->student->id,
                    'name' => $attempt->student->name,
                    'email' => $attempt->student->email,
                    'university' => [
                        'name' => $isUtbk ? ($selectedUniversity ?? $attempt->student->university?->name ?? '-') : null,
                    ],
                    'major' => [
                        'name' => $isUtbk ? ($selectedMajorName ?? $attempt->student->major?->name ?? '-') : null,
                        'minimum_passing_grade' => $minPassing,
                    ],
                ],
            ];
        });

        // ── Analytics ─────────────────────────────────────────────────────────
        $submittedAttempts = $exam->attempts()
            ->where('status', 'submitted')
            ->get();

        $totalAttempts = $submittedAttempts->count();

        $passed = $isUtbk ? $submittedAttempts->filter(function ($attempt) {
            $selections = $attempt->student->university_selections ?? [];
            $firstMajorId = ($selections[0]['majors'][0] ?? null);
            $minPassing = $firstMajorId
                ? Major::find($firstMajorId)?->minimum_passing_grade ?? 0
                : ($attempt->student->major?->minimum_passing_grade ?? 0);

            $skorUtbk = $this->pctToRaw($attempt->irt_block_score);

            return $skorUtbk !== null && $skorUtbk >= $minPassing;
        })->count() : null;

        // Average raw UTBK score across IRT-processed attempts
        $averageRaw = $submittedAttempts
            ->filter(fn ($a) => $a->irt_block_score !== null)
            ->map(fn ($a) => $this->pctToRaw($a->irt_block_score))
            ->avg() ?? 0;
        $averageScore = $isCbt
            ? $submittedAttempts->avg(function ($attempt) {
                $totalScore = (float) ($attempt->total_score ?? 0);

                return $totalScore > 0
                    ? ((float) ($attempt->score ?? 0) / $totalScore) * 100
                    : 0;
            }) ?? 0
            : $averageRaw;

        return Inertia::render('admin/exams/ExamAttempts', [
            'exam' => [
                'id' => $exam->id,
                'name' => $exam->name,
                'type' => $exam->type->value,
                'irt_processed_at' => optional($exam->irt_processed_at)->toIso8601String(),
            ],
            'attempts' => $attemptsTransformed,
            'analytics' => [
                'total_attempts' => $totalAttempts,
                'passed' => $passed,
                'average_score' => round($averageScore, 2),
            ],
            'filters' => [
                'q' => $q,
                'status' => $status,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'freeze' => $freeze,
                'per_page' => $perPage,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Attempt detail
    // ─────────────────────────────────────────────────────────────────────────

    public function attemptDetail(ExamAttempt $attempt)
    {
        $attempt->load([
            'student',
            'exam.questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'exam.questionBanks.questions.options',
            'responses.selectedOption',
        ]);

        $isUtbk = $attempt->exam->type === ExamType::UTBK;
        if ($isUtbk) {
            $attempt->student->load(['university', 'major']);
        }

        $selections = $isUtbk ? ($attempt->student->university_selections ?? []) : [];
        $firstSelection = $selections[0] ?? null;
        $firstMajorId = $firstSelection['majors'][0] ?? null;

        $selectedMajor = $isUtbk && $firstMajorId
            ? Major::find($firstMajorId)
            : null;

        $passingScore = $isUtbk
            ? ($selectedMajor?->minimum_passing_grade
                ?? $attempt->student?->major?->minimum_passing_grade
                ?? 0)
            : null;

        // irt_block_score stores skor_utbk_pct (percentage, e.g. 45.41)
        $skorUtbkPct = $attempt->irt_block_score !== null
            ? round((float) $attempt->irt_block_score, 2)
            : null;

        // Convert to raw UTBK score (same scale as minimum_passing_grade, e.g. 692.35)
        $skorUtbk = $this->pctToRaw($skorUtbkPct);

        // Compare raw vs raw — this is the fixed comparison
        $isPassed = $isUtbk && $skorUtbk !== null
            ? $skorUtbk >= $passingScore
            : null;

        $questions = $this->getExamQuestions($attempt->exam);

        $questionDetails = $questions->map(function ($question) use ($attempt) {
            $response = $attempt->responses->firstWhere('question_id', $question->id);
            $selected = $response?->selectedOption;
            $correctOption = $question->options->firstWhere('is_correct', true);

            return [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'points' => $question->points,
                'student_answer' => $selected?->option_text,
                'correct_answer' => $correctOption?->option_text,
                'is_correct' => (bool) ($selected?->is_correct ?? false),
                'points_earned' => $response && ($selected?->is_correct ?? false)
                    ? $question->points
                    : 0,
            ];
        });

        $allAttempts = $attempt->exam->attempts()
            ->with(['responses.selectedOption'])
            ->get();

        $questionPerformance = $allAttempts
            ->flatMap(fn ($att) => $att->responses)
            ->groupBy('question_id')
            ->map(function ($responses) {
                $total = $responses->count();
                $correct = $responses->filter(fn ($r) => (bool) ($r->selectedOption?->is_correct ?? false))->count();

                return [
                    'total' => $total,
                    'correct' => $correct,
                    'percentage' => $total > 0 ? ($correct / $total) * 100 : 0,
                ];
            });

        return Inertia::render('admin/exams/AttemptDetail', [
            'attempt' => $attempt,
            'exam' => [
                'id' => $attempt->exam->id,
                'name' => $attempt->exam->name,
                'type' => $attempt->exam->type->value,
                'description' => $attempt->exam->description,
                'irt_processed_at' => optional($attempt->exam->irt_processed_at)->toIso8601String(),
            ],
            'student' => [
                'name' => $attempt->student->name,
                'email' => $attempt->student->email,
                'university' => $isUtbk ? $attempt->student->university : null,
                'major' => $isUtbk ? $attempt->student->major : null,
            ],
            'studentData' => [
                'selected_university' => $isUtbk && $firstSelection
                    ? University::find($firstSelection['university_id'])?->name
                    : null,
                'selected_major' => $isUtbk ? $selectedMajor?->name : null,
                'minimum_passing_grade' => $passingScore,
            ],
            'questionBankCount' => $attempt->exam->questionBanks->count(),
            'skorUtbkPct' => $skorUtbkPct,        // e.g. 45.41  — percentage, display only
            'skorUtbk' => $skorUtbk,            // e.g. 692.35 — raw, same scale as passingScore
            'adjustedScore' => $skorUtbk ?? 0,      // legacy alias kept for safety
            'passingScore' => $passingScore,
            'isPassed' => $isPassed,
            'questionDetails' => $questionDetails,
            'questionPerformance' => $questionPerformance,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Export / download
    // ─────────────────────────────────────────────────────────────────────────

    public function exportResults(Exam $exam)
    {
        $isUtbk = $exam->type === ExamType::UTBK;
        $usesIrt = $exam->type->usesIrt();
        $attempts = $exam->attempts()
            ->with([
                'student.school',
                'responses.selectedOption',
            ])
            ->get();

        if ($isUtbk) {
            $attempts->loadMissing(['student.university', 'student.major']);
        }

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

        $baseHeaders = $isUtbk
            ? ['Name', 'Email', 'School', 'Class', 'University', 'Major']
            : ['Name', 'Email', 'School', 'Class'];
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

        if ($isUtbk) {
            array_push($headerRow1, 'Skor UTBK', 'Status');
            array_push($headerRow2, 'Skor UTBK', 'Status');
        } elseif ($usesIrt) {
            array_push($headerRow1, 'Theta (IRT)', 'Skor IRT (%)');
            array_push($headerRow2, 'Theta (IRT)', 'Skor IRT (%)');
        } else {
            if ($exam->type === ExamType::CBT) {
                array_push($headerRow1, 'Poin Diperoleh', 'Poin Maksimum');
                array_push($headerRow2, 'Poin Diperoleh', 'Poin Maksimum');
                $headerRow1[] = 'Persentase';
                $headerRow2[] = 'Persentase';
            } else {
                array_push($headerRow1, 'Nilai Mentah', 'Nilai Maksimum');
                array_push($headerRow2, 'Nilai Mentah', 'Nilai Maksimum');
            }
        }

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
            ];
            if ($isUtbk) {
                $row[] = $student?->university?->name ?? 'N/A';
                $row[] = $student?->major?->name ?? 'N/A';
            }

            $byQuestion = $attempt->responses->keyBy('question_id');

            foreach ($banks as $bank) {
                foreach ($bank['questions'] as $question) {
                    $response = $byQuestion->get($question->id);
                    $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);
                    $row[] = $isCorrect ? 'Correct' : 'Wrong';
                }
            }

            if ($isUtbk) {
                $skorUtbk = $this->pctToRaw($attempt->irt_block_score);
                $passingScore = $student?->major?->minimum_passing_grade ?? 0;
                $row[] = $skorUtbk !== null ? number_format($skorUtbk, 2) : '-';
                $row[] = $skorUtbk !== null && $skorUtbk >= $passingScore ? 'LULUS' : 'TIDAK LULUS';
            } elseif ($usesIrt) {
                $row[] = $attempt->irt_theta !== null ? number_format((float) $attempt->irt_theta, 4) : '-';
                $row[] = $attempt->irt_block_score !== null ? number_format((float) $attempt->irt_block_score, 2) : '-';
            } else {
                $row[] = $attempt->score ?? '-';
                $row[] = $attempt->total_score ?? '-';
                if ($exam->type === ExamType::CBT) {
                    $totalScore = (float) ($attempt->total_score ?? 0);
                    $percentage = $totalScore > 0
                        ? round(((float) ($attempt->score ?? 0) / $totalScore) * 100, 2)
                        : 0;
                    $row[] = $attempt->status === 'submitted'
                        ? number_format($percentage, 2).'%'
                        : '-';
                }
            }

            $rows[] = $row;
        }

        $filename = 'exam-results-'.$exam->id.'-'.now()->format('Y-m-d').'.csv';
        $handle = fopen('php://memory', 'w');

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function exportIrtResults(Exam $exam)
    {
        if (! $exam->type->usesIrt()) {
            return back()->with('error', 'IRT hanya tersedia untuk ujian UTBK dan TKA.');
        }

        if (! $exam->irt_processed_at) {
            return back()->with('error', 'IRT belum diproses untuk ujian ini.');
        }

        $attempts = $exam->attempts()->with(['student', 'responses.selectedOption'])->get();
        $questions = $this->getExamQuestions($exam);

        $tempDir = storage_path('app/tmp');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $studentsPath = $tempDir.DIRECTORY_SEPARATOR.'students_theta.csv';
        $questionsPath = $tempDir.DIRECTORY_SEPARATOR.'questions_difficulty.csv';
        $matrixPath = $tempDir.DIRECTORY_SEPARATOR.'response_matrix.csv';

        // students_theta.csv
        $studentsHandle = fopen($studentsPath, 'w');
        fputcsv($studentsHandle, [
            'student_id',
            'student_name',
            'raw_score',
            'total_score',
            'percent',
            'theta',
            'block_score',
        ]);

        foreach ($attempts as $attempt) {
            $rawScore = (float) ($attempt->score ?? 0);
            $totalScore = (float) ($attempt->total_score ?? 0);
            $percent = $totalScore > 0 ? round(($rawScore / $totalScore) * 100, 2) : 0;

            fputcsv($studentsHandle, [
                $attempt->student_id,
                $attempt->student?->name ?? '',
                $rawScore,
                $totalScore,
                $percent,
                $attempt->irt_theta,
                $attempt->irt_block_score,
            ]);
        }
        fclose($studentsHandle);

        // questions_difficulty.csv
        $questionsHandle = fopen($questionsPath, 'w');
        fputcsv($questionsHandle, ['question_id', 'difficulty_b', 'difficulty_level']);

        foreach ($questions as $question) {
            fputcsv($questionsHandle, [
                $question->id,
                $question->irt_b,
                $this->difficultyLevel($question->irt_b),
            ]);
        }
        fclose($questionsHandle);

        // response_matrix.csv
        $matrixHandle = fopen($matrixPath, 'w');
        $header = ['student_id'];
        foreach ($questions as $question) {
            $header[] = 'Q'.$question->id;
        }
        fputcsv($matrixHandle, $header);

        foreach ($attempts as $attempt) {
            $byQuestion = $attempt->responses->keyBy('question_id');
            $row = [$attempt->student_id];

            foreach ($questions as $question) {
                $response = $byQuestion->get($question->id);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);
                $row[] = $isCorrect ? 1 : 0;
            }

            fputcsv($matrixHandle, $row);
        }
        fclose($matrixHandle);

        // Bundle into ZIP
        $zipName = 'exam_'.$exam->id.'_irt_results.zip';
        $zipPath = $tempDir.DIRECTORY_SEPARATOR.$zipName;
        $zip = new \ZipArchive;
        $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFile($studentsPath, 'students_theta.csv');
        $zip->addFile($questionsPath, 'questions_difficulty.csv');
        $zip->addFile($matrixPath, 'response_matrix.csv');
        $zip->close();

        @unlink($studentsPath);
        @unlink($questionsPath);
        @unlink($matrixPath);

        return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
    }

    public function processIrtScoring(Exam $exam)
    {
        if (! $exam->type->usesIrt()) {
            return back()->with('error', 'IRT hanya tersedia untuk ujian UTBK dan TKA.');
        }

        if ($exam->irt_processed_at) {
            return back()->with('error', 'IRT already processed.');
        }

        $service = new IrtRaschService;
        $result = $service->scoreExam($exam);

        if (! $result['success']) {
            return back()->with('error', $result['message']);
        }

        $exam->update(['irt_processed_at' => now()]);

        $statusNote = $result['converged']
            ? 'converged'
            : 'max iterations reached';

        return back()->with(
            'success',
            "IRT scoring completed in {$result['iterations']} iterations ({$statusNote})."
        );
    }

    public function downloadAttemptPdf(ExamAttempt $attempt)
    {
        $attempt->loadMissing('exam');

        if (! $attempt->exam?->type?->usesIrt()) {
            return back()->with('error', 'Hasil IRT hanya tersedia untuk ujian UTBK dan TKA.');
        }

        if (! $attempt->exam?->irt_processed_at) {
            return back()->with('error', 'IRT belum diproses untuk ujian ini.');
        }

        return (new ExamResultsPdfService)->generate($attempt)
            ->download('exam-attempt-'.$attempt->id.'.pdf');
    }

    public function downloadAttemptLetter(ExamAttempt $attempt)
    {
        $attempt->loadMissing('exam');

        if ($attempt->exam?->type !== ExamType::UTBK) {
            return back()->with('error', 'Surat hasil dengan rekomendasi jurusan hanya tersedia untuk ujian UTBK.');
        }

        if (! $attempt->exam?->irt_processed_at) {
            return back()->with('error', 'IRT belum diproses untuk ujian ini.');
        }

        return (new ExamOfficialLetterPdfService)->generate($attempt)
            ->download('exam-letter-'.$attempt->id.'.pdf');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Unfreeze
    // ─────────────────────────────────────────────────────────────────────────

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

    public function bulkUnfreezeAttempts(Request $request, Exam $exam)
    {
        $validated = $request->validate([
            'attempt_ids' => 'required|array|min:1',
            'attempt_ids.*' => 'integer',
        ]);

        $attempts = $exam->attempts()
            ->whereIn('id', $validated['attempt_ids'])
            ->get();

        if ($attempts->isEmpty()) {
            return back()->with('error', 'Tidak ada percobaan yang dipilih.');
        }

        ExamAttempt::whereIn('id', $attempts->pluck('id'))
            ->update([
                'is_frozen' => false,
                'frozen_at' => null,
                'frozen_reason' => null,
            ]);

        foreach ($attempts as $attempt) {
            $attempt->violations()->delete();
        }

        return back()->with('success', 'Semua percobaan terpilih berhasil dibuka.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function getExamQuestions(Exam $exam): Collection
    {
        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions.options',
        ]);

        return $exam->questionBanks
            ->flatMap(fn ($qb) => $qb->questions->sortBy('id'))
            ->unique('id')
            ->values();
    }

    private function difficultyLevel(?float $b): string
    {
        if ($b === null) {
            return '';
        }
        if ($b < -2) {
            return 'Very Easy';
        }
        if ($b < -1) {
            return 'Easy';
        }
        if ($b <= 1) {
            return 'Medium';
        }
        if ($b <= 2) {
            return 'Hard';
        }

        return 'Very Hard';
    }
}
