<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\ExamViolation;
use App\Models\Major;
use App\Models\University;
use App\Services\ExamResultsPdfService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $exams = Exam::query()
            ->where('school_id', $student->school_id)
            ->where('is_published', true)
            ->with([
                'settings',
                'questionBanks:id,name',
            ])
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
        $exam = request()->query('exam_id')
            ? Exam::with(['settings', 'questionBanks:id,name'])->find(request()->query('exam_id'))
            : null;

        return Inertia::render('student/exams/JoinExam', [
            'universities' => University::with('majors')->get(),
            'exam' => $exam,
        ]);
    }

    private function orderedBanks(ExamAttempt $attempt)
    {
        $attempt->loadMissing('exam.questionBanks');
        return $attempt->exam->questionBanks->values();
    }

    private function currentBank(ExamAttempt $attempt)
    {
        $banks = $this->orderedBanks($attempt);
        $index = max(0, $attempt->current_section - 1);
        return $banks->get($index);
    }

    public function startExam(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|exists:exam_tokens,token',

            // your placement selections (keep as-is)
            'selections' => 'required|array|max:3',
            'selections.*.university_id' => 'required|exists:universities,id',
            'selections.*.majors' => 'required|array|max:4',
            'selections.*.majors.*' => 'required|exists:majors,id',
        ]);

        $totalMajors = collect($validated['selections'])
            ->sum(fn($selection) => count($selection['majors']));

        if ($totalMajors > 4) {
            return back()->withErrors([
                'selections' => 'Maximum 4 majors can be selected',
            ]);
        }

        $token = ExamToken::where('token', $validated['token'])
            ->with(['exam.settings', 'exam.questionBanks'])
            ->firstOrFail();

        $exam = $token->exam;

        if (! $exam || ! $exam->is_published) {
            return back()->withErrors(['token' => 'This exam is not available yet']);
        }

        if (now() < $exam->start_at) {
            return back()->withErrors(['token' => 'This exam has not started yet']);
        }

        if (now() > $exam->end_at) {
            return back()->withErrors(['token' => 'This exam has ended']);
        }

        // NEW: make sure exam actually has banks selected (matches your admin update)
        if ($exam->questionBanks->isEmpty()) {
            return back()->withErrors(['token' => 'This exam has no question banks assigned']);
        }

        $student = auth()->user();

        $student->update([
            'university_selections' => $validated['selections'],
        ]);

        $existingAttempt = ExamAttempt::where('student_id', $student->id)
            ->where('exam_id', $exam->id)
            ->latest()
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->is_frozen) {
                return redirect()->route('student.exams.take', $existingAttempt->id);
            }

            if ($existingAttempt->status === 'in_progress') {
                return redirect()
                    ->route('student.exams.take', $existingAttempt->id)
                    ->with('info', 'Melanjutkan ujian yang sedang berjalan.');
            }
        }

        $attempt = ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id'    => $exam->id,
            'started_at' => now(),
            'status'     => 'in_progress',
            'current_section' => 1,
            'section_started_at' => now(),
        ]);

        return redirect()->route('student.exams.take', $attempt->id);
    }



    public function take(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $attempt->load(['exam.settings', 'exam.questionBanks']);

        if ($attempt->is_frozen) {
            return Inertia::render('student/exams/FrozenExam', [
                'attempt' => $attempt->load('violations'),
                'frozen_reason' => $attempt->frozen_reason,
            ]);
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }
        $bank = $this->currentBank($attempt);

        if (! $bank) {
            return $this->submitExam($attempt);
        }


        if (! $attempt->section_started_at) {
            $attempt->update(['section_started_at' => now()]);
            $attempt->refresh();
        }


        $questions = $bank->questions()
            ->with('options')
            ->get();

        if (optional($attempt->exam->settings)->shuffle_questions) {
            $questions = $questions->shuffle()->values();
        }

        $responses = $attempt->responses()
            ->whereIn('question_id', $questions->pluck('id'))
            ->pluck('selected_option_id', 'question_id')
            ->toArray();

        $sectionTimeLimit = (int) ($bank->pivot->duration_minutes ?? 0);
        $elapsedSeconds = now()->diffInSeconds($attempt->section_started_at);

        if ($sectionTimeLimit > 0 && $elapsedSeconds >= ($sectionTimeLimit * 60)) {
            return $this->finishSection($attempt);
        }

        return Inertia::render('student/exams/TakeExam', [
            'attempt' => $attempt,
            'exam' => $attempt->exam->load('settings', 'questionBanks:id,name'),
            'questions' => $questions,
            'responses' => $responses,
            'section' => [
                'index' => (int) $attempt->current_section,
                'total' => (int) $attempt->exam->questionBanks->count(),
                'question_bank_id' => (int) $bank->id,
                'title' => (string) ($bank->name ?? 'Sesi'),
                'timeLimit' => $sectionTimeLimit,
                'elapsedSeconds' => $elapsedSeconds,
                'serverNow' => now()->toIso8601String(),
                'sectionStartedAt' => optional($attempt->section_started_at)->toIso8601String(),
            ],
        ]);
    }


    public function saveAnswer(Request $request, ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $attempt->load(['exam.settings']);

        if ($attempt->is_frozen) {
            return response()->json([
                'error' => 'Ujian dibekukan. Hubungi admin.'
            ], 403);
        }

        $attempt->loadMissing(['exam.questionBanks']);

        $bank = $this->currentBank($attempt);
        $sectionLimit = (int) ($bank?->pivot?->duration_minutes ?? 0);

        if ($sectionLimit > 0 && $attempt->section_started_at) {
            $elapsed = now()->diffInMinutes($attempt->section_started_at);
            if ($elapsed >= $sectionLimit) {
                return response()->json(['error' => 'Section time expired'], 403);
            }
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

    public function finishSection(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->is_frozen) {
            return redirect()->route('student.exams.take', $attempt->id);
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        $attempt->load(['exam.questionBanks']);

        $totalSections = $attempt->exam->questionBanks->count();
        $nextSection = (int) $attempt->current_section + 1;

        // last section -> submit
        if ($nextSection > $totalSections) {
            return $this->submitExam($attempt);
        }

        $attempt->update([
            'current_section' => $nextSection,
            'section_started_at' => now(),
        ]);

        return redirect()->route('student.exams.take', $attempt->id)
            ->with('info', 'Berlanjut ke sesi berikutnya.');
    }


    public function submitExam(ExamAttempt $attempt)
    {
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        $attempt->load(['exam.settings', 'exam.questionBanks']);

        $questions = $this->getExamQuestions($attempt->exam);

        $totalScore = 0;
        $maxScore = 0;

        foreach ($questions as $question) {
            $maxScore += (int) $question->points;

            $response = $attempt->responses()
                ->where('question_id', $question->id)
                ->first();

            // same logic as your current version
            if ($response && $response->selectedOption && $response->selectedOption->is_correct) {
                $totalScore += (int) $question->points;
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

        $attempt->load(['exam.settings', 'exam.questionBanks', 'student']);

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
            if (!$university) continue;

            $majors = Major::whereIn('id', $selection['majors'])->get();

            $universitySelections[] = [
                'university' => [
                    'id' => $university->id,
                    'name' => $university->name,
                    'city' => $university->city,
                ],
                'majors' => $majors->map(fn(Major $major) => [
                    'id' => $major->id,
                    'name' => $major->name,
                    'minimum_passing_grade' => $major->minimum_passing_grade,
                ])->values()->all(),
            ];

            foreach ($majors as $major) {
                $studentSelections[] = [
                    'university' => [
                        'id' => $university->id,
                        'name' => $university->name,
                        'city' => $university->city,
                    ],
                    'major' => [
                        'id' => $major->id,
                        'name' => $major->name,
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
                    'id' => $fallbackUniversity->id,
                    'name' => $fallbackUniversity->name,
                    'city' => $fallbackUniversity->city,
                ] : null,
                'major' => $fallbackMajor ? [
                    'id' => $fallbackMajor->id,
                    'name' => $fallbackMajor->name,
                    'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
                ] : null,
            ];

            if ($fallbackUniversity && $fallbackMajor) {
                $universitySelections[] = [
                    'university' => [
                        'id' => $fallbackUniversity->id,
                        'name' => $fallbackUniversity->name,
                        'city' => $fallbackUniversity->city,
                    ],
                    'majors' => [[
                        'id' => $fallbackMajor->id,
                        'name' => $fallbackMajor->name,
                        'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
                    ]],
                ];
            }
        }

        $firstSelectionMajorGrade = $studentSelections[0]['major']['minimum_passing_grade'] ?? null;
        $passingScore = $firstSelectionMajorGrade ?? ($fallbackMajor->minimum_passing_grade ?? 0);

        $isPassed = $attempt->score >= $passingScore;

        $questions = $this->getExamQuestions($attempt->exam);

        $questionDetails = $questions->map(function ($question) use ($attempt) {
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
                'id' => $fallbackUniversity->id,
                'name' => $fallbackUniversity->name,
                'city' => $fallbackUniversity->city,
            ] : null,
            'major' => $fallbackMajor ? [
                'id' => $fallbackMajor->id,
                'name' => $fallbackMajor->name,
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

        // If already frozen, return a clear message
        if ($attempt->is_frozen) {
            return response()->json([
                'success' => false,
                'is_frozen' => true,
                'message' => 'Ujian Anda sedang dibekukan. Silakan hubungi admin/pengawas untuk membukanya kembali.',
            ], 403);
        }

        $validated = $request->validate([
            'violation_type' => 'required|string|in:tab_switch,copy_attempt,paste_attempt',
        ]);

        $MAX_VIOLATIONS = 3;

        $type = $validated['violation_type'];
        $label = $this->violationLabel($type);

        // Create / update violation counter
        $violation = ExamViolation::firstOrCreate(
            [
                'attempt_id' => $attempt->id,
                'violation_type' => $type,
            ],
            [
                'count' => 0,
                'last_occurred_at' => now(),
            ]
        );

        $violation->increment('count');
        $violation->update(['last_occurred_at' => now()]);

        // Freeze if exceeded
        if ($violation->count >= $MAX_VIOLATIONS) {
            $attempt->update([
                'is_frozen' => true,
                'frozen_at' => now(),
                'frozen_reason' =>
                "Ujian dibekukan karena {$label} sebanyak {$violation->count} kali, melebihi batas yang diizinkan.",
            ]);

            return response()->json([
                'success' => true,
                'is_frozen' => true,
                'violation_count' => $violation->count,
                'max_violations' => $MAX_VIOLATIONS,
                'message' =>
                "Ujian dibekukan karena {$label} terlalu sering. Silakan hubungi admin/pengawas untuk melanjutkan ujian.",
            ]);
        }

        // Not frozen yet: return a warning (optional but nice UX)
        $remaining = max(0, $MAX_VIOLATIONS - $violation->count);

        return response()->json([
            'success' => true,
            'is_frozen' => false,
            'violation_count' => $violation->count,
            'max_violations' => $MAX_VIOLATIONS,
            'remaining' => $remaining,
            'message' =>
            "Terdeteksi pelanggaran: {$label}. "
                . "Peringatan {$violation->count}/{$MAX_VIOLATIONS}. "
                . ($remaining > 0 ? "Sisa {$remaining} sebelum ujian dibekukan." : ''),
        ]);
    }

    private function violationLabel(string $type): string
    {
        return match ($type) {
            'tab_switch' => 'berpindah tab / aplikasi',
            'copy_attempt' => 'mencoba menyalin teks',
            'paste_attempt' => 'mencoba menempelkan teks',
            default => 'pelanggaran',
        };
    }

    private function getExamQuestions(Exam $exam)
    {
        $exam->loadMissing(['questionBanks.questions.options']);

        return $exam->questionBanks
            ->flatMap(fn($bank) => $bank->questions)
            ->unique('id')
            ->values();
    }
}
