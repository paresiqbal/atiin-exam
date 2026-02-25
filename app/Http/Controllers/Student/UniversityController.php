<?php

namespace App\Http\Controllers\Student;

use App\Models\ExamAttempt;
use App\Models\University;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class UniversityController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $latestAttempt = ExamAttempt::where('student_id', $student->id)
            ->with('exam.questionBanks')
            ->orderByDesc('completed_at')
            ->first();

        $bankCount = $latestAttempt?->exam?->questionBanks?->count() ?? 0;
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;
        $studentScore = $latestAttempt
            ? (float) $latestAttempt->score / $bankDivisor
            : null;

        $universities = University::with(['majors' => function ($q) {
            $q->select('id', 'university_id', 'name', 'description', 'minimum_passing_grade');
        }])
            ->orderBy('name')
            ->get();

        return Inertia::render('student/universities/StudentUnivIndex', [
            'universities'          => $universities,
            'student_latest_score'  => $studentScore,
            'latest_exam'           => $latestAttempt ? [
                'exam_name'    => $latestAttempt->exam->name,
                'completed_at' => optional($latestAttempt->completed_at)->format('Y-m-d'),
                'total_score'  => $latestAttempt->total_score,
            ] : null,
        ]);
    }


    public function compareScore(University $university)
    {
        $student = auth()->user();

        // Get student's latest exam attempt
        $latestAttempt = ExamAttempt::where('student_id', $student->id)
            ->with('exam.questionBanks')
            ->orderByDesc('completed_at')
            ->first();

        if (! $latestAttempt) {
            // Better UX: send them to exams page instead of just "back"
            return redirect()
                ->route('student.exams.index')
                ->with('error', 'Anda belum memiliki hasil ujian. Silakan kerjakan ujian terlebih dahulu untuk membandingkan nilai.');
        }

        $bankCount = $latestAttempt?->exam?->questionBanks?->count() ?? 0;
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;
        $studentScore = (float) $latestAttempt->score / $bankDivisor;

        // Majors with comparison info for THIS university
        $majors = $university->majors
            ->map(function ($major) use ($studentScore) {
                $passingScore = (int) $major->minimum_passing_grade;
                $meetsRequirement = $studentScore >= $passingScore;

                return [
                    'id'                     => $major->id,
                    'name'                   => $major->name,
                    'description'            => $major->description,
                    'minimum_passing_grade'  => $passingScore,
                    'student_score'          => $studentScore,
                    'meets_requirement'      => $meetsRequirement,
                    'difference'             => $studentScore - $passingScore, // + = above, - = below
                    'status'                 => $meetsRequirement ? 'qualified' : 'not_qualified',
                ];
            })
            ->values();

        return Inertia::render('student/universities/CompareScore', [
            'university'           => [
                'id'          => $university->id,
                'name'        => $university->name,
                'city'        => $university->city,
                'website'     => $university->website,
                'description' => $university->description,
            ],
            'student_latest_score' => $studentScore,
            'latest_exam'          => [
                'exam_name'    => $latestAttempt->exam->name,
                'completed_at' => optional($latestAttempt->completed_at)->format('Y-m-d'),
                'total_score'  => $latestAttempt->total_score,
            ],
            'majors'               => $majors,
        ]);
    }
}
