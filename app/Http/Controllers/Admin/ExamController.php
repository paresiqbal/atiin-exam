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
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);

        $exams = Exam::query()
            ->with([
                'questionBanks:id,name', // ✅ ini
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

        $newToken = ExamToken::create([
            'exam_id' => $exam->id,
            'token'   => strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6)),
        ]);

        return back()->with('success', 'Token regenerated successfully');
    }


    public function edit(Exam $exam): Response
    {
        $questionBanks = QuestionBank::select('id', 'name')->get();

        return Inertia::render('admin/exams/EditExam', [
            'exam' => $exam->load('settings'),
            'questionBanks' => $questionBanks,
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

            // NEW:
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
            'time_limit_minutes' => $totalMinutes, // <-- total from banks
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

        // Exams that have attempts (cannot be deleted)
        $examsWithAttempts = Exam::whereIn('id', $ids)
            ->whereHas('attempts')
            ->get();

        // Exams that are safe to delete (no attempts)
        $deletableIds = Exam::whereIn('id', $ids)
            ->whereDoesntHave('attempts')
            ->pluck('id')
            ->all();

        if (! empty($deletableIds)) {
            Exam::whereIn('id', $deletableIds)->delete();
        }

        // Build flash message
        $deletedCount = count($deletableIds);
        $blockedCount = $examsWithAttempts->count();

        if ($deletedCount === 0 && $blockedCount > 0) {
            return redirect()
                ->route('admin.exams.index')
                ->with(
                    'warning',
                    'Tidak ada ujian yang dihapus karena semua ujian sudah pernah dikerjakan siswa.'
                );
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
        $attemptsQuery = $exam->attempts()
            ->with(['student.university', 'student.major'])
            ->orderByDesc('started_at'); // 👈 better: show latest started first

        $attempts = $attemptsQuery->paginate(15);

        $attemptsTransformed = $attempts->through(function (ExamAttempt $attempt) {
            $score      = (float) ($attempt->score ?? 0);
            $totalScore = (float) ($attempt->total_score ?? 0);

            // Only calculate percentage for submitted attempts
            $percentage = ($totalScore > 0 && $attempt->status === 'submitted')
                ? round(($score / $totalScore) * 100, 2)
                : 0;

            $minPassing = $attempt->student->major->minimum_passing_grade ?? 0;
            $isPassed   = $attempt->status === 'submitted'
                ? $score >= $minPassing
                : false;

            return [
                'id'           => $attempt->id,
                'score'        => $score,
                'total_score'  => $totalScore,
                'percentage'   => $percentage,
                'is_passed'    => $isPassed,
                'status'       => $attempt->status,             // 👈 add this
                'is_frozen'    => (bool) $attempt->is_frozen,   // 👈 add this
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

        // Analytics on submitted attempts only
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

        $averagePercentage = $submittedAttempts
            ->filter(fn($a) => $a->total_score > 0)
            ->map(fn($a) => ($a->score / $a->total_score) * 100)
            ->avg() ?? 0;

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

    public function attemptDetail(ExamAttempt $attempt)
    {
        $passingScore = $attempt->student->major->minimum_passing_grade ?? 0;
        $isPassed = $attempt->score >= $passingScore;

        $questionDetails = $attempt->exam->questionBank->questions
            ->map(function ($question) use ($attempt) {
                $response = $attempt->responses()
                    ->where('question_id', $question->id)
                    ->first();

                $correctOption = $question->options()
                    ->where('is_correct', true)
                    ->first();

                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'student_answer' => $response?->selectedOption?->option_text,
                    'correct_answer' => $correctOption?->option_text,
                    'is_correct' => $response?->selectedOption?->is_correct ?? false,
                    'points_earned' => $response ? ($response->selectedOption?->is_correct ? $question->points : 0) : 0,
                ];
            });

        $questionPerformance = $attempt->exam->attempts()
            ->with('responses')
            ->get()
            ->flatMap(function ($att) {
                return $att->responses;
            })
            ->groupBy('question_id')
            ->map(function ($responses) {
                $correct = $responses->filter(fn($r) => $r->selectedOption?->is_correct)->count();
                return [
                    'total' => $responses->count(),
                    'correct' => $correct,
                    'percentage' => $responses->count() > 0 ? ($correct / $responses->count()) * 100 : 0,
                ];
            });

        return Inertia::render('admin/exams/AttemptDetail', [
            'attempt' => $attempt,
            'exam' => $attempt->exam,
            'student' => $attempt->student->load('university', 'major'),
            'passingScore' => $passingScore,
            'isPassed' => $isPassed,
            'questionDetails' => $questionDetails,
            'questionPerformance' => $questionPerformance,
        ]);
    }

    public function exportResults(Exam $exam)
    {
        $attempts = $exam->attempts()
            ->with('student.university', 'student.major', 'student.school', 'responses.question')
            ->get();

        $questions = $exam->questionBank->questions()->orderBy('id')->get();

        // Create CSV data
        $headers = ['Name', 'Email', 'School', 'Class', 'University', 'Major'];

        foreach ($questions as $question) {
            $headers[] = "Q{$question->id}";
        }

        $headers[] = 'Total Score';
        $headers[] = 'Status';

        $rows = [];
        $rows[] = $headers;

        foreach ($attempts as $attempt) {
            $student = $attempt->student;

            $row = [
                $student->name,
                $student->email,
                $student->school?->name ?? 'N/A',
                $student->class ?? 'N/A',
                $student->university?->name ?? 'N/A',
                $student->major?->name ?? 'N/A',
            ];

            foreach ($questions as $question) {
                $response = $attempt->responses()
                    ->where('question_id', $question->id)
                    ->first();

                $isCorrect = $response && $response->selectedOption && $response->selectedOption->is_correct;
                $row[] = $isCorrect ? 'Correct' : 'Wrong';
            }

            $row[] = "{$attempt->score}/{$attempt->total_score}";
            $passingScore = $student->major?->minimum_passing_grade ?? 0;
            $row[] = $attempt->score >= $passingScore ? 'PASSED' : 'FAILED';

            $rows[] = $row;
        }

        // Generate CSV
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
        // Reset freeze state
        $attempt->update([
            'is_frozen' => false,
            'frozen_at' => null,
            'frozen_reason' => null,
        ]);

        // Optionally reset violations
        $attempt->violations()->delete();

        return back()->with('success', 'Ujian berhasil dibuka kembali untuk siswa.');
    }
}
