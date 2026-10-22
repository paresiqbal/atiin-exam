<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
        ]);
        $query = trim($validated['q'] ?? '');

        if ($query === '') {
            return response()->json([
                'students' => [],
                'exams' => [],
                'question_banks' => [],
            ]);
        }

        $searchTerm = "%{$query}%";

        return response()->json([
            'students' => User::query()
                ->where('role', 'student')
                ->where(fn ($builder) => $builder
                    ->where('name', 'like', $searchTerm)
                    ->orWhere('email', 'like', $searchTerm))
                ->orderBy('name')
                ->limit(5)
                ->get(['id', 'name', 'email'])
                ->map(fn (User $student): array => [
                    'id' => $student->id,
                    'label' => $student->name,
                    'description' => $student->email,
                    'href' => "/admin/students/{$student->id}",
                ]),
            'exams' => Exam::query()
                ->where('name', 'like', $searchTerm)
                ->orderBy('name')
                ->limit(5)
                ->get(['id', 'name', 'type'])
                ->map(fn (Exam $exam): array => [
                    'id' => $exam->id,
                    'label' => $exam->name,
                    'description' => $exam->type->value,
                    'href' => "/admin/exams/{$exam->id}",
                ]),
            'question_banks' => QuestionBank::query()
                ->where('name', 'like', $searchTerm)
                ->orderBy('name')
                ->limit(5)
                ->get(['id', 'name'])
                ->map(fn (QuestionBank $bank): array => [
                    'id' => $bank->id,
                    'label' => $bank->name,
                    'description' => null,
                    'href' => "/admin/question-banks/{$bank->id}",
                ]),
        ]);
    }
}
