<?php

namespace App\Http\Controllers\Admin;

use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class QuestionController extends Controller
{
    public function create(QuestionBank $questionBank)
    {
        return Inertia::render('admin/question-banks/QuestionFormPage', [
            'questionBank' => $questionBank,
            'question' => null,
        ]);
    }

    public function edit(Question $question)
    {
        $question->load('options');

        return Inertia::render('admin/question-banks/QuestionFormPage', [
            'questionBank' => $question->questionBank,
            'question' => $question,
        ]);
    }

    public function store(Request $request, QuestionBank $questionBank)
    {
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
        $question->delete();

        return back()->with('success', 'Question deleted successfully');
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:2048'],
        ]);

        $path = $request->file('image')->store('question-images', 'public');
        $url = Storage::url($path);

        return response()->json(['url' => $url]);
    }
}
