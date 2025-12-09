<?php

namespace App\Http\Controllers\Student;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\ExamViolation;
use App\Models\Major;
use App\Models\University;
use App\Services\ExamResultsPdfService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $exams = Exam::where('school_id', $student->school_id)
            ->where('is_published', true)
            ->with('questionBank.questions', 'settings')
            ->orderBy('start_at')
            ->paginate(15);

        $exams->getCollection()->transform(function ($exam) {
            $exam->status = match (true) {
                now() < $exam->start_at => 'coming_soon',
                now() > $exam->end_at => 'ended',
                default => 'available'
            };
            return $exam;
        });

        return Inertia::render('student/exams/IndexExam', [
            'exams' => $exams,
        ]);
    }


    public function joinForm(): Response
    {
        $exam = request()->query('exam_id') ? Exam::find(request()->query('exam_id')) : null;

        return Inertia::render('student/exams/JoinExam', [
            'universities' => University::with('majors')->get(),
            'exam' => $exam,
        ]);
    }

    public function startExam(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|exists:exam_tokens,token',
            'selections' => 'required|array|max:2',
            'selections.*.university_id' => 'required|exists:universities,id',
            'selections.*.majors' => 'required|array|max:4',
            'selections.*.majors.*' => 'required|exists:majors,id',
        ]);

        // Count total majors selected
        $totalMajors = collect($validated['selections'])
            ->sum(fn($selection) => count($selection['majors']));

        if ($totalMajors > 4) {
            return back()->withErrors(['selections' => 'Maximum 4 majors can be selected']);
        }

        $token = ExamToken::where('token', $validated['token'])->first();

        if (!$token) {
            return back()->withErrors(['token' => 'Invalid token']);
        }

        $exam = $token->exam;

        if (!$exam->is_published) {
            return back()->withErrors(['token' => 'This exam is not available yet']);
        }

        if (now() < $exam->start_at) {
            return back()->withErrors(['token' => 'This exam has not started yet']);
        }

        if (now() > $exam->end_at) {
            return back()->withErrors(['token' => 'This exam has ended']);
        }

        $student = auth()->user();

        // 🔹 Save / update university selections
        $student->update([
            'university_selections' => $validated['selections'],
        ]);

        // 🔹 Check if this student already has an attempt for this exam
        $existingAttempt = ExamAttempt::where('student_id', $student->id)
            ->where('exam_id', $exam->id)
            ->latest()
            ->first();

        if ($existingAttempt) {
            // If attempt is frozen, send them to the same attempt (FrozenExam will show)
            if ($existingAttempt->is_frozen) {
                return redirect()
                    ->route('student.exams.take', $existingAttempt->id);
            }

            // If still in progress, just continue that attempt
            if ($existingAttempt->status === 'in_progress') {
                return redirect()
                    ->route('student.exams.take', $existingAttempt->id)
                    ->with('info', 'Kamu sudah memulai ujian ini, lanjutkan ujian yang sama.');
            }

            // If already submitted, block new attempt (1 attempt per exam)
            if ($existingAttempt->status === 'submitted') {
                return back()->withErrors([
                    'token' => 'Kamu sudah menyelesaikan ujian ini dan tidak dapat mengulang.',
                ]);
            }
        }

        // 🔹 No existing attempt that can be reused → create a new one
        $attempt = ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'started_at' => now(),
            'status' => 'in_progress',
        ]);

        return redirect()->route('student.exams.take', $attempt->id);
    }



    public function take(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->is_frozen) {
            return Inertia::render('student/exams/FrozenExam', [
                'attempt' => $attempt->load('violations'),
                'frozen_reason' => $attempt->frozen_reason,
            ]);
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        $questions = $attempt->exam->questionBank->questions()
            ->with('options')
            ->get();

        if ($attempt->exam->settings->shuffle_questions) {
            $questions = $questions->shuffle();
        }

        $responses = $attempt->responses()
            ->pluck('selected_option_id', 'question_id')
            ->toArray();

        $timeLimit = $attempt->exam->settings->time_limit_minutes;
        $elapsedMinutes = now()->diffInMinutes($attempt->started_at);

        if ($elapsedMinutes > $timeLimit) {
            return $this->submitExam($attempt);
        }

        return Inertia::render('student/exams/TakeExam', [
            'attempt' => $attempt,
            'exam' => $attempt->exam->load('settings'),
            'questions' => $questions,
            'responses' => $responses,
            'timeLimit' => $timeLimit,
            'elapsedMinutes' => $elapsedMinutes,
        ]);
    }

    public function saveAnswer(Request $request, ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->is_frozen) {
            return response()->json([
                'error' => 'Ujian dibekukan. Hubungi admin.'
            ], 403);
        }

        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $timeLimit = $attempt->exam->settings->time_limit_minutes;
        if (now()->diffInMinutes($attempt->started_at) > $timeLimit) {
            return response()->json(['error' => 'Time expired'], 403);
        }

        $validated = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'selected_option_id' => 'nullable|exists:question_options,id',
        ]);

        $attempt->responses()->updateOrCreate(
            [
                'question_id' => $validated['question_id'],
            ],
            [
                'selected_option_id' => $validated['selected_option_id'],
                'answered_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    public function submitExam(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        $totalScore = 0;
        $maxScore = 0;

        foreach ($attempt->exam->questionBank->questions as $question) {
            $maxScore += $question->points;

            $response = $attempt->responses()
                ->where('question_id', $question->id)
                ->first();

            if ($response && $response->selectedOption && $response->selectedOption->is_correct) {
                $totalScore += $question->points;
            }
        }

        $attempt->update([
            'status' => 'submitted',
            'completed_at' => now(),
            'score' => $totalScore,
            'total_score' => $maxScore,
        ]);

        return redirect()->route('student.exams.results', $attempt->id);
    }

    public function results(ExamAttempt $attempt): Response
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $student = $attempt->student;

        $rawSelections = $student->university_selections ?? [];

        if (!is_array($rawSelections)) {
            $rawSelections = [];
        }

        $studentSelections = [];
        $universitySelections = [];

        foreach ($rawSelections as $selection) {
            if (
                !isset($selection['university_id'], $selection['majors']) ||
                !is_array($selection['majors'])
            ) {
                continue;
            }

            $university = University::find($selection['university_id']);
            if (!$university) {
                continue;
            }

            $majors = Major::whereIn('id', $selection['majors'])->get();

            $universitySelections[] = [
                'university' => [
                    'id'   => $university->id,
                    'name' => $university->name,
                    'city' => $university->city,
                ],
                'majors' => $majors->map(function (Major $major) {
                    return [
                        'id'                    => $major->id,
                        'name'                  => $major->name,
                        'minimum_passing_grade' => $major->minimum_passing_grade,
                    ];
                })->values()->all(),
            ];

            foreach ($majors as $major) {
                $studentSelections[] = [
                    'university' => [
                        'id'   => $university->id,
                        'name' => $university->name,
                        'city' => $university->city,
                    ],
                    'major' => [
                        'id'                    => $major->id,
                        'name'                  => $major->name,
                        'minimum_passing_grade' => $major->minimum_passing_grade,
                    ],
                ];
            }
        }

        $fallbackMajor = $student->major;
        $fallbackUniversity = $student->university;

        if (empty($studentSelections) && ($fallbackMajor || $fallbackUniversity)) {
            $studentSelections[] = [
                'university' => $fallbackUniversity ? [
                    'id'   => $fallbackUniversity->id,
                    'name' => $fallbackUniversity->name,
                    'city' => $fallbackUniversity->city,
                ] : null,
                'major' => $fallbackMajor ? [
                    'id'                    => $fallbackMajor->id,
                    'name'                  => $fallbackMajor->name,
                    'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
                ] : null,
            ];

            if ($fallbackUniversity && $fallbackMajor) {
                $universitySelections[] = [
                    'university' => [
                        'id'   => $fallbackUniversity->id,
                        'name' => $fallbackUniversity->name,
                        'city' => $fallbackUniversity->city,
                    ],
                    'majors' => [[
                        'id'                    => $fallbackMajor->id,
                        'name'                  => $fallbackMajor->name,
                        'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
                    ]],
                ];
            }
        }

        $firstSelectionMajorGrade =
            $studentSelections[0]['major']['minimum_passing_grade'] ?? null;

        $passingScore = $firstSelectionMajorGrade
            ?? ($fallbackMajor->minimum_passing_grade ?? 0);

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
                    'points_earned' => $response
                        ? ($response->selectedOption?->is_correct ? $question->points : 0)
                        : 0,
                ];
            });

        $primaryPlacement = $studentSelections[0] ?? [
            'university' => $fallbackUniversity ? [
                'id'   => $fallbackUniversity->id,
                'name' => $fallbackUniversity->name,
                'city' => $fallbackUniversity->city,
            ] : null,
            'major' => $fallbackMajor ? [
                'id'                    => $fallbackMajor->id,
                'name'                  => $fallbackMajor->name,
                'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
            ] : null,
        ];

        return Inertia::render('student/exams/Results', [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'total_score' => $attempt->total_score,
                'completed_at' => $attempt->completed_at
                    ? \Carbon\Carbon::parse($attempt->completed_at)->toIso8601String()
                    : null,
            ],
            'exam' => [
                'title' => $attempt->exam->title ?? $attempt->exam->name,
                'description' => $attempt->exam->description,
            ],
            'passingScore' => $passingScore,
            'isPassed' => $isPassed,
            'questionDetails' => $questionDetails,
            'studentPlacement' => $primaryPlacement,
            'studentSelections' => $studentSelections,
            'universitySelections' => $universitySelections,
        ]);
    }

    public function downloadResults(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $pdfService = new ExamResultsPdfService();
        $pdf = $pdfService->generate($attempt);

        return $pdf->download('exam-results-' . $attempt->id . '.pdf');
    }

    public function logViolation(Request $request, ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->is_frozen) {
            return response()->json([
                'success' => false,
                'is_frozen' => true,
                'message' => 'Ujian Anda dibekukan. Hubungi admin untuk membuka kembali.'
            ], 403);
        }

        $validated = $request->validate([
            'violation_type' => 'required|string|in:tab_switch,copy_attempt,paste_attempt',
        ]);

        $violation = ExamViolation::firstOrCreate(
            [
                'attempt_id' => $attempt->id,
                'violation_type' => $validated['violation_type'],
            ],
            [
                'count' => 0,
                'last_occurred_at' => now(),
            ]
        );

        $violation->increment('count');
        $violation->update(['last_occurred_at' => now()]);

        $MAX_VIOLATIONS = 3;

        if ($violation->count >= $MAX_VIOLATIONS) {
            $attempt->update([
                'is_frozen' => true,
                'frozen_at' => now(),
                'frozen_reason' => "Terlalu banyak {$validated['violation_type']} ({$violation->count}x)",
            ]);

            return response()->json([
                'success' => true,
                'is_frozen' => true,
                'violation_count' => $violation->count,
                'max_violations' => $MAX_VIOLATIONS,
                'message' => 'Ujian dibekukan karena terlalu banyak pelanggaran. Hubungi admin.'
            ]);
        }

        return response()->json([
            'success' => true,
            'is_frozen' => false,
            'violation_count' => $violation->count,
            'max_violations' => $MAX_VIOLATIONS,
            'remaining' => $MAX_VIOLATIONS - $violation->count,
        ]);
    }
}
