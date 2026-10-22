<?php

namespace App\Http\Controllers\Student;

use App\Enums\ExamType;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ExamHistoryController extends Controller
{
    public function index(Request $request)
    {
        $student = auth()->user();
        $search = trim((string) $request->input('q', ''));
        $sort = $request->input('sort', 'date') === 'score' ? 'score' : 'date';

        $attempts = ExamAttempt::where('student_id', $student->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('exam', function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                });
            })
            ->with('exam.questionBanks')
            ->orderByDesc('completed_at')
            ->paginate(20)
            ->withQueryString();

        $attempts->getCollection()->transform(function ($attempt) {
            $examType = $attempt->exam?->type;
            $irtProcessed = $examType?->usesIrt()
                && (bool) $attempt->exam?->irt_processed_at
                && $attempt->irt_block_score !== null;
            $hasSubmittedCbtAttempt = $examType === ExamType::CBT
                && $attempt->status === 'submitted';

            $attempt->percentage = match (true) {
                $irtProcessed => (float) $attempt->irt_block_score,
                $hasSubmittedCbtAttempt && (float) $attempt->total_score > 0 => ((float) $attempt->score / (float) $attempt->total_score) * 100,
                $hasSubmittedCbtAttempt => 0,
                default => null,
            };
            $attempt->raw_score = $hasSubmittedCbtAttempt ? $attempt->score : null;
            $attempt->total_score = $hasSubmittedCbtAttempt ? $attempt->total_score : null;
            $attempt->is_passed = null;
            if (! $examType?->usesIrt()) {
                $attempt->irt_theta = null;
            }
            $attempt->exam_name = $attempt->exam->title
                ?? $attempt->exam->name
                ?? 'Unknown Exam';
            $attempt->exam_type = $examType?->value;

            return $attempt;
        });

        return Inertia::render('student/exams/HistoryExam', [
            'attempts' => $attempts,
            'filters' => [
                'q' => $search,
                'sort' => $sort,
            ],
        ]);
    }
}
