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
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(): Response
    {
        $exams = Exam::with('questionBank', 'settings')
            ->withCount('attempts')
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('admin/exams/IndexExam', [
            'exams' => $exams,
        ]);
    }

    public function create()
    {
        $questionBanks = QuestionBank::orderBy('name')
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
            'question_bank_id' => 'required|exists:question_banks,id',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after_or_equal:start_at',
            'time_limit_minutes' => 'required|integer|min:1|max:300',
            'shuffle_questions' => 'boolean',
            'allow_review' => 'boolean',
            'school_id' => 'required|exists:schools,id',

        ]);

        $admin = auth()->user();

        $exam = Exam::create([
            'admin_id'         => $admin->id,
            'school_id'        => $validated['school_id'],
            'question_bank_id' => $validated['question_bank_id'],
            'name'             => $validated['name'],
            'description'      => $validated['description'],
            'start_at'         => $validated['start_at'],
            'end_at'           => $validated['end_at'],
            'is_published'     => false,
        ]);

        ExamSetting::create([
            'exam_id'            => $exam->id,
            'time_limit_minutes' => $validated['time_limit_minutes'],
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
        return Inertia::render('admin/exams/ShowExam', [
            'exam' => $exam->load('questionBank.questions.options', 'settings', 'tokens'),
        ]);
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'question_bank_id' => 'required|exists:question_banks,id',
            'start_at' => 'required|date',
            'end_at'   => 'required|date|after_or_equal:start_at',
            'time_limit_minutes' => 'required|integer|min:1|max:300',
            'shuffle_questions'  => 'boolean',
            'allow_review'       => 'boolean',
            'school_id'       => 'required|exists:schools,id',



        ]);

        $exam->update([
            'name'             => $validated['name'],
            'description'      => $validated['description'],
            'question_bank_id' => $validated['question_bank_id'],
            'start_at'         => $validated['start_at'],
            'end_at'           => $validated['end_at'],

            'school_id'     => $validated['school_id'] ?? $exam->school_id,
        ]);

        $exam->settings()->update([
            'time_limit_minutes' => $validated['time_limit_minutes'],
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

    public function publish(Exam $exam)
    {
        $exam->update(['is_published' => true]);

        return back()->with('success', 'Exam published successfully');
    }

    public function attempts(Exam $exam)
    {
        $attempts = $exam->attempts()
            ->with('student.university', 'student.major')
            ->orderByDesc('completed_at')
            ->paginate(15);

        $analytics = [
            'total_attempts' => $exam->attempts()->count(),
            'passed' => $exam->attempts()
                ->whereRaw('score >= (SELECT minimum_passing_grade FROM majors WHERE id = exam_attempts.student_id)')
                ->count(),
            'average_score' => $exam->attempts()
                ->whereNotNull('score')
                ->avg('score'),
        ];

        return Inertia::render('admin/exams/ExamAttempts', [
            'exam' => $exam,
            'attempts' => $attempts,
            'analytics' => $analytics,
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
}
