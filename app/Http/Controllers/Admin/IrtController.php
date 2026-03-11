<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\School;
use App\Models\User;
use App\Services\IrtExportService;
use App\Services\IrtRaschService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class IrtController extends Controller
{
    public function index(Request $request)
    {
        $hasIrtProcessedAt = Schema::hasColumn('exams', 'irt_processed_at');

        $query = Exam::query()
            ->withCount([
                'attempts',
                'attempts as submitted_attempts_count' => function ($q) {
                    $q->where('status', 'submitted');
                },
            ])
            ->with(['school']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        if ($request->filled('class')) {
            $query->whereHas('attempts.student', function ($q) use ($request) {
                $q->where('class', $request->class);
            });
        }

        if ($request->filled('status') && $hasIrtProcessedAt) {
            if ($request->status === 'processed') {
                $query->whereNotNull('irt_processed_at');
            }

            if ($request->status === 'not_processed') {
                $query->whereNull('irt_processed_at');
            }
        }

        $exams = $query->latest()->paginate(20)->withQueryString();

        $schools = School::orderBy('name')->get(['id', 'name']);
        $classes = User::where('role', 'student')
            ->whereNotNull('class')
            ->distinct()
            ->orderBy('class')
            ->pluck('class')
            ->values();

        return Inertia::render('admin/irt/IrtProcessing', [
            'exams'            => $exams,
            'schools'          => $schools,
            'classes'          => $classes,
            'filters'          => [
                'search'    => $request->input('search'),
                'school_id' => $request->input('school_id'),
                'class'     => $request->input('class'),
                'status'    => $request->input('status'),
            ],
            'hasIrtProcessedAt' => $hasIrtProcessedAt,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    // ── NEW: Export results as Excel ─────────────────────────────────────────
    public function export(Exam $exam)
    {
        if (! $exam->irt_processed_at) {
            return back()->with('error', 'IRT belum diproses untuk ujian ini.');
        }

        $path     = (new IrtExportService())->export($exam);
        $filename = 'IRT_Hasil_' . str_replace(' ', '_', $exam->name) . '.xlsx';

        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function process(Request $request, Exam $exam)
    {
        if (! Schema::hasColumn('exams', 'irt_processed_at')) {
            return back()->with('error', 'Kolom irt_processed_at belum ada. Jalankan migrasi terlebih dahulu.');
        }

        // Allow reprocessing when force=true is passed
        $force = filter_var($request->input('force', false), FILTER_VALIDATE_BOOLEAN);

        if ($exam->irt_processed_at && ! $force) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'IRT already processed. Use force=true to reprocess.'], 409);
            }

            return back()->with('error', 'IRT sudah diproses. Gunakan tombol Reprocess untuk memproses ulang.');
        }

        if ($exam->end_at && now()->lt($exam->end_at)) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Exam has not ended yet'], 409);
            }

            return back()->with('error', 'Exam has not ended yet.');
        }

        $irtService = new IrtRaschService();
        $result = $irtService->scoreExam($exam);

        if (! $result['success']) {
            return back()->with('error', $result['message']);
        }

        $exam->update(['irt_processed_at' => now()]);

        $message = $force
            ? 'IRT reprocessing completed successfully.'
            : 'IRT scoring completed.';

        return back()->with('success', $message);
    }

    public function runBulkIrt(Request $request)
    {
        if (! Schema::hasColumn('exams', 'irt_processed_at')) {
            return back()->with('error', 'Kolom irt_processed_at belum ada. Jalankan migrasi terlebih dahulu.');
        }

        $validated = $request->validate([
            'exam_id'    => 'required|exists:exams,id',
            'school_ids' => 'nullable|array',
            'school_ids.*' => 'integer|exists:schools,id',
            'classes'    => 'nullable|array',
            'classes.*'  => 'string|max:50',
            'force'      => 'nullable|boolean',
        ]);

        $force = ! empty($validated['force']);
        $exam  = Exam::findOrFail($validated['exam_id']);

        if ($exam->irt_processed_at && ! $force) {
            return back()->with('error', 'IRT sudah diproses. Gunakan force reprocess untuk memproses ulang.');
        }

        if ($exam->end_at && now()->lt($exam->end_at)) {
            return back()->with('error', 'Exam has not ended yet.');
        }

        $attemptsQuery = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('status', 'submitted')
            ->with(['responses.selectedOption', 'student']);

        if (! empty($validated['school_ids'])) {
            $attemptsQuery->whereHas('student', function ($q) use ($validated) {
                $q->whereIn('school_id', $validated['school_ids']);
            });
        }

        if (! empty($validated['classes'])) {
            $attemptsQuery->whereHas('student', function ($q) use ($validated) {
                $q->whereIn('class', $validated['classes']);
            });
        }

        $attempts = $attemptsQuery->get();

        if ($attempts->isEmpty()) {
            return back()->with('error', 'No attempts found for selected filters.');
        }

        $irtService = new IrtRaschService();
        $result = $irtService->scoreExam($exam, 0.001, 100, $attempts);

        if (! $result['success']) {
            return back()->with('error', $result['message']);
        }

        $exam->update(['irt_processed_at' => now()]);

        return back()->with('success', 'IRT processing completed successfully.');
    }

    public function processMultiple(Request $request)
    {
        if (! Schema::hasColumn('exams', 'irt_processed_at')) {
            return back()->with('error', 'Kolom irt_processed_at belum ada. Jalankan migrasi terlebih dahulu.');
        }

        $validated = $request->validate([
            'exam_ids'   => 'required|array|min:1',
            'exam_ids.*' => 'integer|exists:exams,id',
            'force'      => 'nullable|boolean',
        ]);

        $force = ! empty($validated['force']);
        $exams = Exam::whereIn('id', $validated['exam_ids'])->get();

        if ($exams->isEmpty()) {
            return back()->with('error', 'No exams selected.');
        }

        $processed = 0;
        $skipped   = 0;

        foreach ($exams as $exam) {
            // Skip already-processed exams unless force=true
            if ($exam->irt_processed_at && ! $force) {
                $skipped++;
                continue;
            }

            if ($exam->end_at && now()->lt($exam->end_at)) {
                $skipped++;
                continue;
            }

            $irtService = new IrtRaschService();
            $result = $irtService->scoreExam($exam);

            if (! $result['success']) {
                return back()->with('error', $result['message']);
            }

            $exam->update(['irt_processed_at' => now()]);
            $processed++;
        }

        if ($processed === 0) {
            return back()->with('error', 'No exams were processed. They may already be processed — use Force Reprocess to override.');
        }

        $message = ($force ? 'Force reprocessed' : 'IRT processed') . " for {$processed} exam(s).";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} exam(s) (already processed or not ended).";
        }

        return back()->with('success', $message);
    }
}
