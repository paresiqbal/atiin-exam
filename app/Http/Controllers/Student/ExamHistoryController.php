<?php

namespace App\Http\Controllers\Student;

use App\Models\ExamAttempt;
use App\Models\Major;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ExamHistoryController extends Controller
{
    public function index()
    {
        $student = auth()->user();

        $attempts = ExamAttempt::where('student_id', $student->id)
            ->with('exam.questionBanks', 'student.major')
            ->orderByDesc('completed_at')
            ->paginate(20);

        // Add status to each attempt
        $attempts->getCollection()->transform(function ($attempt) {
            $selections = $attempt->student?->university_selections ?? [];
            $firstSelection = is_array($selections) ? ($selections[0] ?? null) : null;
            $firstMajorId = is_array($firstSelection) ? ($firstSelection['majors'][0] ?? null) : null;

            $selectedMajor = $firstMajorId ? Major::find($firstMajorId) : null;
            $passingScore = $selectedMajor?->minimum_passing_grade
                ?? $attempt->student?->major?->minimum_passing_grade
                ?? 0;

            // If IRT isn't processed yet, mark as waiting (null pass/fail + no score).
            $irtProcessed = (bool) $attempt->exam?->irt_processed_at
                && $attempt->irt_block_score !== null;

            $attempt->passing_score = (float) $passingScore;
            $attempt->percentage = $irtProcessed ? (float) $attempt->irt_block_score : null;
            $attempt->is_passed = $irtProcessed
                ? ((float) $attempt->irt_block_score >= (float) $passingScore)
                : null;

            // 👇 pick whatever field your Exam model uses
            $attempt->exam_name = $attempt->exam->title
                ?? $attempt->exam->name
                ?? 'Unknown Exam';

            return $attempt;
        });

        return Inertia::render('student/exams/HistoryExam', [
            'attempts' => $attempts,
        ]);
    }
}
