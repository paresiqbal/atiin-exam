<?php

namespace App\Http\Controllers\Teacher;

use App\Models\QuestionBank;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class QuestionBankController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $questionBanks = QuestionBank::query()
            ->where('teacher_id', $request->user()->id)
            ->withCount('questions')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('teacher/question-banks/QuestionBankIndex', [
            'questionBanks' => $questionBanks,
        ]);
    }

    public function create()
    {
        return Inertia::render('teacher/question-banks/QuestionBankCreate');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        QuestionBank::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'teacher_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('teacher.question-banks.index')
            ->with('success', 'Question bank created successfully');
    }

    public function show(QuestionBank $questionBank)
    {
        $this->ensureOwner($request = request(), $questionBank);

        return Inertia::render('teacher/question-banks/QuestionBankShow', [
            'questionBank' => $questionBank->load('questions.options'),
        ]);
    }

    public function edit(QuestionBank $questionBank)
    {
        $this->ensureOwner($request = request(), $questionBank);

        return Inertia::render('teacher/question-banks/QuestionBankEdit', [
            'questionBank' => $questionBank,
        ]);
    }

    public function update(Request $request, QuestionBank $questionBank)
    {
        $this->ensureOwner($request, $questionBank);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $questionBank->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('teacher.question-banks.index')
            ->with('success', 'Question bank updated successfully');
    }

    public function destroy(Request $request, QuestionBank $questionBank)
    {
        $this->ensureOwner($request, $questionBank);

        $questionBank->delete();

        return redirect()
            ->route('teacher.question-banks.index')
            ->with('success', 'Question bank deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()
                ->route('teacher.question-banks.index')
                ->with('info', 'Tidak ada bank soal yang dipilih untuk dihapus.');
        }

        // scoped delete: only delete teacher's own banks
        QuestionBank::where('teacher_id', $request->user()->id)
            ->whereIn('id', $ids)
            ->delete();

        return redirect()
            ->route('teacher.question-banks.index')
            ->with('success', 'Bank soal terpilih berhasil dihapus.');
    }

    private function ensureOwner(Request $request, QuestionBank $questionBank): void
    {
        if ((int) $questionBank->teacher_id !== (int) $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}
