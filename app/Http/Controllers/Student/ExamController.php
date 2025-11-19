<?php

namespace App\Http\Controllers\Student;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function joinForm(): Response
    {
        return Inertia::render('student/exams/JoinExam', [
            'universities' => University::with('majors')->get(),
        ]);
    }

    public function startExam(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|exists:exam_tokens,token',
            'university_id' => 'required|exists:universities,id',
            'major_id' => 'required|exists:majors,id',
        ]);

        // Find exam by token
        $token = ExamToken::where('token', $validated['token'])->first();

        if (!$token) {
            return back()->withErrors(['token' => 'Invalid token']);
        }

        // Check if token already used (one-time use only)
        if ($token->used_at) {
            return back()->withErrors(['token' => 'This token has already been used']);
        }

        $exam = $token->exam;

        // If exam no longer exists (exam_id points to non-existing exam)
        if (!$exam) {
            return back()->withErrors([
                'token' => 'This exam is no longer available',
            ]);
        }

        // Check if exam is published
        if (!$exam->is_published) {
            return back()->withErrors([
                'token' => 'This exam is not available yet',
            ]);
        }

        // Update student's university & major
        $student = auth()->user();
        $student->update([
            'university_id' => $validated['university_id'],
            'major_id' => $validated['major_id'],
        ]);

        // Create exam attempt
        $attempt = ExamAttempt::create([
            'student_id' => $student->id,
            'exam_id' => $exam->id,
            'started_at' => now(),
            'status' => 'in_progress',
        ]);

        // Mark token as used
        $token->update(['used_at' => now()]);

        return redirect()->route('student.exams.take', $attempt->id);
    }

    public function take(ExamAttempt $attempt)
    {
        // Check if student owns this attempt
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check if already submitted
        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        // Load questions with options
        $questions = $attempt->exam->questionBank->questions()
            ->with('options')
            ->get();

        // Shuffle if enabled
        if ($attempt->exam->settings->shuffle_questions) {
            $questions = $questions->shuffle();
        }

        // Get student's previous answers
        $responses = $attempt->responses()
            ->pluck('selected_option_id', 'question_id')
            ->toArray();

        $timeLimit = $attempt->exam->settings->time_limit_minutes;
        $elapsedMinutes = now()->diffInMinutes($attempt->started_at);

        // Auto-submit if time expired
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
        // Check if student owns this attempt
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check if time expired
        $timeLimit = $attempt->exam->settings->time_limit_minutes;
        if (now()->diffInMinutes($attempt->started_at) > $timeLimit) {
            return response()->json(['error' => 'Time expired'], 403);
        }

        $validated = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'selected_option_id' => 'nullable|exists:question_options,id',
        ]);

        // Save or update response
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
        // Check if student owns this attempt
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check if already submitted
        if ($attempt->status === 'submitted') {
            return redirect()->route('student.exams.results', $attempt->id);
        }

        // Calculate score
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

        // Update attempt with final score
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
        // Check if student owns this attempt
        if ($attempt->student_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

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

        return Inertia::render('student/exams/Results', [
            'attempt' => $attempt,
            'exam' => $attempt->exam,
            'passingScore' => $passingScore,
            'isPassed' => $isPassed,
            'questionDetails' => $questionDetails,
        ]);
    }
}
