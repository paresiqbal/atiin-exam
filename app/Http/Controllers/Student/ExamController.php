<?php

namespace App\Http\Controllers\Student;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamToken;
use App\Models\University;
use Illuminate\Http\Request;
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

        // Check if exam is published
        if (!$exam->is_published) {
            return back()->withErrors(['token' => 'This exam is not available yet']);
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
}
