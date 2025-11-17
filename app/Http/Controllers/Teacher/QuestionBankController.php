<?php

namespace App\Http\Controllers\Teacher;

use App\Models\QuestionBank;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;


class QuestionBankController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if (!$user) {
            abort(401, 'Not authenticated');
        }

        $questionBanks = $user->questionBanks()->withCount('questions')->paginate(15);

        return Inertia::render('teacher/question-banks/QuestionIndex', [
            'questionBanks' => $questionBanks,
        ]);
    }

    public function create()
    {
        return Inertia::render('teacher/question-banks/QuestionCreate');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        auth()->user()->questionBanks()->create($validated);

        return redirect()->route('teacher.question-banks.index')
            ->with('success', 'Question bank created successfully');
    }

    public function edit(QuestionBank $questionBank)
    {
        // Check if current user owns this question bank
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('teacher/question-banks/QuestionEdit', [
            'questionBank' => $questionBank,
        ]);
    }

    public function update(Request $request, QuestionBank $questionBank)
    {
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',  // Change from 'title'
            'description' => 'nullable|string',
        ]);

        $questionBank->update($validated);

        return redirect()->route('teacher.question-banks.index')
            ->with('success', 'Question bank updated successfully');
    }

    public function destroy(QuestionBank $questionBank)
    {
        // Check if current user owns this question bank
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $questionBank->delete();

        return redirect()->route('teacher.question-banks.index')
            ->with('success', 'Question bank deleted successfully');
    }
}
