<?php

namespace App\Http\Controllers\Teacher;

use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class QuestionController extends Controller
{
    public function store(Request $request, QuestionBank $questionBank)
    {
        // Check if teacher owns this question bank
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,multiple_select,true_false',
            'points' => 'required|integer|min:1|max:45',
            'image_url' => 'nullable|url',
            'options' => 'required|array|min:2',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        $question = $questionBank->questions()->create([
            'question_text' => $validated['question_text'],
            'question_type' => $validated['question_type'],
            'points' => $validated['points'],
            'image_url' => $validated['image_url'],
        ]);

        // Create options for this question
        foreach ($validated['options'] as $index => $option) {
            QuestionOption::create([
                'question_id' => $question->id,
                'option_text' => $option['option_text'],
                'is_correct' => $option['is_correct'],
                'option_order' => $index,
            ]);
        }

        return back()->with('success', 'Question created successfully');
    }

    public function update(Request $request, Question $question)
    {
        // Check if teacher owns this question's bank
        if ($question->questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,multiple_select,true_false',
            'points' => 'required|integer|min:1|max:45',
            'image_url' => 'nullable|url',
            'options' => 'required|array|min:2',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        $question->update([
            'question_text' => $validated['question_text'],
            'question_type' => $validated['question_type'],
            'points' => $validated['points'],
            'image_url' => $validated['image_url'],
        ]);

        // Delete old options and create new ones
        $question->options()->delete();

        foreach ($validated['options'] as $index => $option) {
            QuestionOption::create([
                'question_id' => $question->id,
                'option_text' => $option['option_text'],
                'is_correct' => $option['is_correct'],
                'option_order' => $index,
            ]);
        }

        return back()->with('success', 'Question updated successfully');
    }

    public function destroy(Question $question)
    {
        // Check if teacher owns this question's bank
        if ($question->questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $question->delete();

        return back()->with('success', 'Question deleted successfully');
    }
}
