<?php

namespace App\Services;

use App\Models\ExamAttempt;
use App\Models\Major;
use App\Models\University;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class ExamOfficialLetterPdfService
{
    private const ATTIN_FORMULA = 1525.0;

    public function generate(ExamAttempt $attempt)
    {
        $attempt->loadMissing([
            'student.university',
            'student.major',
            'student.school',
            'exam.questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'exam.questionBanks.questions.options',
            'responses.selectedOption',
        ]);

        $student = $attempt->student;
        $exam    = $attempt->exam;

        $sortedBanks = $exam->questionBanks
            ->sortBy(fn($bank) => $bank->pivot?->sort_order ?? 0)
            ->values();

        $bankCount   = $sortedBanks->count();
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;

        $responsesByQuestion = $attempt->responses->keyBy('question_id');

        // ── Per-bank summaries ────────────────────────────────────────────────
        $bankSummaries = $sortedBanks->map(function ($bank, $index) use ($responsesByQuestion) {
            $questions    = $bank->questions->unique('id')->values();
            $correctCount = 0;

            foreach ($questions as $question) {
                $response  = $responsesByQuestion->get($question->id);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);
                if ($isCorrect) {
                    $correctCount++;
                }
            }

            $total      = $questions->count();
            $blockScore = $total > 0 ? round(($correctCount / $total) * 1000, 2) : 0;

            return [
                'index'           => $index + 1,
                'bank_name'       => $bank->name ?? 'Bank Soal',
                'correct_count'   => $correctCount,
                'total_questions' => $total,
                'block_score'     => $blockScore,   // out of 1000
            ];
        });

        // ── IRT scores ────────────────────────────────────────────────────────
        // Prefer saved irt_block_score; recalculate only if null.
        if ($attempt->irt_block_score !== null) {
            $skorUtbkPct = round((float) $attempt->irt_block_score, 2);
            $totalSkor   = round($skorUtbkPct * self::ATTIN_FORMULA / 100 * $bankDivisor, 2);
            $skorUtbk    = round($totalSkor / $bankDivisor, 2);
        } else {
            $totalSkor   = $bankSummaries->sum('block_score');
            $skorUtbk    = round($totalSkor / $bankDivisor, 2);
            $skorUtbkPct = round(($skorUtbk / self::ATTIN_FORMULA) * 100, 2);
        }

        // ── Student selections ────────────────────────────────────────────────
        [$studentSelections, $selectionFallback] = $this->buildStudentSelections($student);

        if (empty($studentSelections) && $selectionFallback) {
            $studentSelections[] = $selectionFallback;
        }

        // ── Selection rows — compare skor_utbk (raw) vs minimum_passing_grade ──
        $selectionRows = collect($studentSelections)->map(function ($selection) use ($skorUtbk, $skorUtbkPct) {
            $universityName = $selection['university']['name'] ?? '-';
            $majorName      = $selection['major']['name']      ?? '-';
            $minimumGrade   = (float) ($selection['major']['minimum_passing_grade'] ?? 0);
            $passed         = $skorUtbk >= $minimumGrade;  // raw vs raw

            return [
                'program'       => trim($universityName . ' — ' . $majorName),
                'minimum_grade' => $minimumGrade,
                'skor_utbk'     => $skorUtbk,      // raw score for comparison display
                'skor_utbk_pct' => $skorUtbkPct,   // kept for display only
                'result'        => $passed ? 'LULUS' : 'TIDAK LULUS',
                'is_passed'     => $passed,
            ];
        })->values();

        // ── Recommendations — only when at least one selection failed ─────────
        // Left : same major name, different university, student qualifies
        // Right: same university, different major, student qualifies
        $majorGroupOptions = [];
        $ptnGroupOptions   = [];
        $anyFailed         = $selectionRows->contains('is_passed', false);

        if ($anyFailed) {
            $selectedMajorNames = collect($studentSelections)
                ->pluck('major.name')
                ->filter()
                ->unique()
                ->values();

            $selectedUniversityId = collect($studentSelections)
                ->pluck('university.id')
                ->filter()
                ->first();

            if (!$selectedUniversityId && $selectionFallback) {
                $selectedUniversityId = $selectionFallback['university']['id'] ?? null;
            }

            if ($selectedMajorNames->isNotEmpty()) {
                $majorGroupOptions = Major::with('university')
                    ->whereIn('name', $selectedMajorNames)
                    ->where('minimum_passing_grade', '<=', $skorUtbk)  // raw vs raw
                    ->when(
                        $selectedUniversityId,
                        fn($q) => $q->where('university_id', '!=', $selectedUniversityId)
                    )
                    ->orderByDesc('minimum_passing_grade')
                    ->limit(5)
                    ->get()
                    ->map(fn(Major $m) => [
                        'label'         => $m->name . ' — ' . ($m->university?->name ?? '-'),
                        'minimum_grade' => $m->minimum_passing_grade,
                    ])
                    ->values()
                    ->all();
            }

            if ($selectedUniversityId) {
                $ptnGroupOptions = Major::where('university_id', $selectedUniversityId)
                    ->when(
                        $selectedMajorNames->isNotEmpty(),
                        fn($q) => $q->whereNotIn('name', $selectedMajorNames)
                    )
                    ->where('minimum_passing_grade', '<=', $skorUtbk)  // raw vs raw
                    ->orderByDesc('minimum_passing_grade')
                    ->limit(5)
                    ->get()
                    ->map(fn(Major $m) => [
                        'label'         => $m->name,
                        'minimum_grade' => $m->minimum_passing_grade,
                    ])
                    ->values()
                    ->all();
            }
        }

        $examDateText = $attempt->completed_at
            ? Carbon::parse($attempt->completed_at)->locale('id')->translatedFormat('l, d F Y')
            : null;

        $data = [
            'student_name'  => $student->name,
            'student_email' => $student->email,
            'school'        => $student->school?->name ?? 'N/A',
            'class'         => $student->class ?? 'N/A',

            'exam_name' => $exam->name,
            'exam_date' => $examDateText,

            'skor_utbk'     => $skorUtbk,
            'skor_utbk_pct' => $skorUtbkPct,
            'bank_summaries' => $bankSummaries,

            'selection_rows'      => $selectionRows,
            'any_failed'          => $anyFailed,
            'major_group_options' => $majorGroupOptions,
            'ptn_group_options'   => $ptnGroupOptions,
        ];

        return Pdf::loadView('pdfs.official-letter', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 0.6)
            ->setOption('margin-right', 0.6)
            ->setOption('margin-bottom', 0.6)
            ->setOption('margin-left', 0.6);
    }

    private function buildStudentSelections($student): array
    {
        $rawSelections = $student->university_selections ?? [];
        if (!is_array($rawSelections)) {
            $rawSelections = [];
        }

        $studentSelections = [];

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

            foreach ($majors as $major) {
                $studentSelections[] = [
                    'university' => [
                        'id'   => $university->id,
                        'name' => $university->name,
                        'city' => $university->city ?? null,
                    ],
                    'major' => [
                        'id'                    => $major->id,
                        'name'                  => $major->name,
                        'minimum_passing_grade' => $major->minimum_passing_grade,
                    ],
                ];
            }
        }

        $fallbackMajor      = $student->major;
        $fallbackUniversity = $student->university;
        $fallback           = null;

        if ($fallbackMajor || $fallbackUniversity) {
            $fallback = [
                'university' => $fallbackUniversity ? [
                    'id'   => $fallbackUniversity->id,
                    'name' => $fallbackUniversity->name,
                    'city' => $fallbackUniversity->city ?? null,
                ] : null,
                'major' => $fallbackMajor ? [
                    'id'                    => $fallbackMajor->id,
                    'name'                  => $fallbackMajor->name,
                    'minimum_passing_grade' => $fallbackMajor->minimum_passing_grade,
                ] : null,
            ];
        }

        return [$studentSelections, $fallback];
    }
}
