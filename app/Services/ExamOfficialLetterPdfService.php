<?php

namespace App\Services;

use App\Models\ExamAttempt;
use App\Models\Major;
use App\Models\University;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class ExamOfficialLetterPdfService
{
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
        $exam = $attempt->exam;

        $sortedBanks = $exam->questionBanks
            ->sortBy(fn($bank) => $bank->pivot?->sort_order ?? 0)
            ->values();

        $responsesByQuestion = $attempt->responses->keyBy('question_id');

        $bankSummaries = $sortedBanks->map(function ($bank, $index) use ($responsesByQuestion) {
            $questions = $bank->questions->unique('id')->values();
            $correctCount = 0;
            $earnedScore = 0;
            $totalScore = 0;

            foreach ($questions as $question) {
                $totalScore += (int) $question->points;
                $response = $responsesByQuestion->get($question->id);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);

                if ($isCorrect) {
                    $correctCount += 1;
                    $earnedScore += (int) $question->points;
                }
            }

            return [
                'index' => $index + 1,
                'bank_name' => $bank->name ?? 'Question Bank',
                'correct_count' => $correctCount,
                'total_questions' => $questions->count(),
                'score_earned' => $earnedScore,
                'score_total' => $totalScore,
            ];
        });

        [$studentSelections, $selectionFallback] = $this->buildStudentSelections($student);

        if (empty($studentSelections) && $selectionFallback) {
            $studentSelections[] = $selectionFallback;
        }

        $bankCount = $sortedBanks->count();
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;
        $adjustedScore = (float) ($attempt->score ?? 0) / $bankDivisor;

        $selectionRows = collect($studentSelections)->map(function ($selection) use ($adjustedScore) {
            $universityName = $selection['university']['name'] ?? '-';
            $majorName = $selection['major']['name'] ?? '-';
            $minimumGrade = $selection['major']['minimum_passing_grade'] ?? 0;

            return [
                'program' => trim($universityName . ' - ' . $majorName),
                'minimum_grade' => $minimumGrade,
                'result' => $adjustedScore >= (float) $minimumGrade ? 'LULUS' : 'TL',
            ];
        })->values();

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

        $majorGroupOptions = [];
        if ($selectedMajorNames->isNotEmpty()) {
            $majorGroupQuery = Major::with('university')
                ->whereIn('name', $selectedMajorNames)
                ->where('minimum_passing_grade', '<=', $adjustedScore)
                ->orderByDesc('minimum_passing_grade');

            if ($selectedUniversityId) {
                $majorGroupQuery->where('university_id', '!=', $selectedUniversityId);
            }

            $majorGroupOptions = $majorGroupQuery
                ->limit(5)
                ->get()
                ->map(function (Major $major) {
                    $university = $major->university?->name ?? '-';
                    return [
                        'label' => "{$major->name} - {$university}",
                        'minimum_grade' => $major->minimum_passing_grade,
                    ];
                })
                ->values()
                ->all();
        }

        $ptnGroupOptions = [];
        if ($selectedUniversityId) {
            $ptnGroupOptions = Major::where('university_id', $selectedUniversityId)
                ->when(
                    $selectedMajorNames->isNotEmpty(),
                    fn($q) => $q->whereNotIn('name', $selectedMajorNames)
                )
                ->where('minimum_passing_grade', '<=', $adjustedScore)
                ->orderByDesc('minimum_passing_grade')
                ->limit(5)
                ->get()
                ->map(function (Major $major) {
                    return [
                        'label' => $major->name,
                        'minimum_grade' => $major->minimum_passing_grade,
                    ];
                })
                ->values()
                ->all();
        }

        $examDateText = $attempt->completed_at
            ? Carbon::parse($attempt->completed_at)->locale('id')->translatedFormat('l, d F Y')
            : null;

        $data = [
            'student_name' => $student->name,
            'student_email' => $student->email,
            'school' => $student->school?->name ?? 'N/A',
            'class' => $student->class ?? 'N/A',
            'exam_name' => $exam->name,
            'exam_date' => $examDateText,
            'score' => (int) floor($adjustedScore),
            'bank_summaries' => $bankSummaries,
            'selection_rows' => $selectionRows,
            'major_group_options' => $majorGroupOptions,
            'ptn_group_options' => $ptnGroupOptions,
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
        $fallback = null;

        if ($fallbackMajor || $fallbackUniversity) {
            $fallback = [
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
        }

        return [$studentSelections, $fallback];
    }
}
