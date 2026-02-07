<?php

namespace App\Http\Controllers\Admin;

use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class QuestionBankController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $questionBanks = QuestionBank::withCount('questions')
            ->paginate($perPage)
            ->withQueryString();

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
        return Inertia::render('admin/question-banks/QuestionBankEdit', [
            'questionBank' => $questionBank,
            'teachers' => User::where('role', 'teacher')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, QuestionBank $questionBank)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'teacher_id' => 'nullable|exists:users,id',
        ]);

        $update = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ];

        if (array_key_exists('teacher_id', $validated)) {
            $update['teacher_id'] = $validated['teacher_id'];
        }

        $questionBank->update($update);

        return redirect()->route('admin.question-banks.index')
            ->with('success', 'Question bank updated successfully');
    }

    public function destroy(QuestionBank $questionBank)
    {
        $questionBank->delete();

        return redirect()->route('admin.question-banks.index')
            ->with('success', 'Question bank deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('admin.question-banks.index')
                ->with('info', 'Tidak ada bank soal yang dipilih untuk dihapus.');
        }

        QuestionBank::whereIn('id', $ids)->delete();

        return redirect()
            ->route('admin.question-banks.index')
            ->with('success', 'Bank soal terpilih berhasil dihapus.');
    }
}
