<?php

namespace App\Http\Controllers\Teacher;

use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Maatwebsite\Excel\Facades\Excel;

class QuestionImportController extends Controller
{
    public function preview(Request $request, QuestionBank $questionBank)
    {
        // Check if teacher owns this question bank
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            $file = $request->file('file');
            $rows = Excel::toArray(null, $file);

            if (empty($rows) || empty($rows[0])) {
                return response()->json([
                    'success' => false,
                    'message' => 'File is empty',
                ], 400);
            }

            // Parse rows (skip header)
            $data = array_slice($rows[0], 1);
            $preview = [];
            $errors = [];

            foreach ($data as $index => $row) {
                if (empty(array_filter($row))) continue;

                $rowNum = $index + 2;

                try {
                    $item = [
                        'question_text' => $row[0] ?? null,
                        'question_type' => $row[1] ?? null,
                        'points' => $row[2] ?? null,
                        'image_url' => $row[3] ?? null,
                        'options' => $this->parseOptions($row, 4),
                    ];

                    $this->validateQuestion($item, $rowNum, $errors);
                    $preview[] = array_merge(['row' => $rowNum], $item);
                } catch (\Exception $e) {
                    $errors[] = "Row $rowNum: {$e->getMessage()}";
                }
            }

            return response()->json([
                'success' => true,
                'preview' => $preview,
                'errors' => $errors,
                'total_rows' => count($preview),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage(),
            ], 400);
        }
    }

    public function import(Request $request, QuestionBank $questionBank)
    {
        // Check if teacher owns this question bank
        if ($questionBank->teacher_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            $file = $request->file('file');
            $rows = Excel::toArray(null, $file);

            if (empty($rows) || empty($rows[0])) {
                return back()->withErrors(['file' => 'File is empty']);
            }

            $data = array_slice($rows[0], 1);

            $created = 0;
            $failed = 0;
            $errors = [];

            foreach ($data as $index => $row) {
                if (empty(array_filter($row))) continue;

                $rowNum = $index + 2;

                try {
                    $question_text = $row[0] ?? null;
                    $question_type = $row[1] ?? null;
                    $points = (int)($row[2] ?? 0);
                    $image_url = $row[3] ?? null;

                    // Validate question
                    if (empty($question_text)) {
                        throw new \Exception('Question text is required');
                    }

                    if (!in_array($question_type, ['multiple_choice', 'multiple_select', 'true_false'])) {
                        throw new \Exception('Invalid question type');
                    }

                    if ($points < 1 || $points > 45) {
                        throw new \Exception('Points must be between 1-45');
                    }

                    // Create question
                    $question = $questionBank->questions()->create([
                        'question_text' => $question_text,
                        'question_type' => $question_type,
                        'points' => $points,
                        'image_url' => $image_url,
                    ]);

                    // Parse and create options
                    $options = $this->parseOptions($row, 4);

                    if (empty($options)) {
                        throw new \Exception('At least 2 options are required');
                    }

                    foreach ($options as $opt_index => $option) {
                        QuestionOption::create([
                            'question_id' => $question->id,
                            'option_text' => $option['text'],
                            'is_correct' => $option['is_correct'],
                            'option_order' => $opt_index,
                        ]);
                    }

                    $created++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Row $rowNum: {$e->getMessage()}";
                }
            }

            return redirect()->route('teacher.question-banks.show', $questionBank->id)
                ->with('success', "Import completed! Created: $created, Failed: $failed")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    private function parseOptions($row, $startIndex)
    {
        $options = [];

        // Format: option1|option2|option3|option4
        // Correct answer marked with * e.g., *option1
        $optionsString = $row[$startIndex] ?? '';

        if (empty($optionsString)) {
            return [];
        }

        $optionParts = explode('|', $optionsString);

        foreach ($optionParts as $part) {
            $part = trim($part);
            if (empty($part)) continue;

            $is_correct = false;
            if (strpos($part, '*') === 0) {
                $is_correct = true;
                $part = substr($part, 1); // Remove *
            }

            $options[] = [
                'text' => $part,
                'is_correct' => $is_correct,
            ];
        }

        return $options;
    }

    private function validateQuestion($question, $rowNum, &$errors)
    {
        if (empty($question['question_text'])) {
            throw new \Exception('Question text is required');
        }

        if (!in_array($question['question_type'], ['multiple_choice', 'multiple_select', 'true_false'])) {
            throw new \Exception('Invalid type: ' . $question['question_type']);
        }

        if ((int)$question['points'] < 1 || (int)$question['points'] > 45) {
            throw new \Exception('Points must be 1-45');
        }

        if (count($question['options']) < 2) {
            throw new \Exception('Need at least 2 options');
        }

        // Check at least one correct answer
        $hasCorrect = false;
        foreach ($question['options'] as $opt) {
            if ($opt['is_correct']) {
                $hasCorrect = true;
                break;
            }
        }

        if (!$hasCorrect) {
            throw new \Exception('At least one correct answer required');
        }
    }

    public function downloadTemplate()
    {
        $headers = ['Question Text', 'Type', 'Points', 'Image URL', 'Options (use | to separate, * for correct)'];
        $rows = [
            ['What is 2+2?', 'multiple_choice', '5', '', '*4|3|5|6'],
            ['Is the sky blue?', 'true_false', '3', '', '*Yes|No'],
            ['Which are fruits?', 'multiple_select', '10', '', '*Apple|Carrot|*Banana|Broccoli'],
        ];

        $filename = 'questions_import_template.csv';
        $handle = fopen('php://memory', 'w');

        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"$filename\"");
    }
}
