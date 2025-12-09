<?php

namespace App\Http\Controllers\Admin;

use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class QuestionBankController extends Controller
{
    public function index()
    {
        $questionBanks = QuestionBank::with('teacher', 'questions')
            ->withCount('questions')
            ->paginate(15);

        return Inertia::render('admin/question-banks/QuestionBankIndex', [
            'questionBanks' => $questionBanks,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/question-banks/QuestionBankCreate', [
            'teachers' => User::where('role', 'teacher')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        QuestionBank::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'teacher_id'  => $request->user()->id,
        ]);

        return redirect()
            ->route('admin.question-banks.index')
            ->with('success', 'Question bank created successfully');
    }


    public function show(QuestionBank $questionBank)
    {
        return Inertia::render('admin/question-banks/QuestionBankShow', [
            'questionBank' => $questionBank->load('teacher', 'questions.options'),
        ]);
    }

    public function edit(QuestionBank $questionBank)
    {
        return Inertia::render('admin/question-banks/Edit', [
            'questionBank' => $questionBank,
            'teachers' => User::where('role', 'teacher')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, QuestionBank $questionBank)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'teacher_id' => 'required|exists:users,id',
        ]);

        $questionBank->update($validated);

        return redirect()->route('admin.question-banks.index')
            ->with('success', 'Question bank updated successfully');
    }

    public function destroy(QuestionBank $questionBank)
    {
        $questionBank->delete();

        return redirect()->route('admin.question-banks.index')
            ->with('success', 'Question bank deleted successfully');
    }
}
