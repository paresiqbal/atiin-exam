<?php

namespace App\Http\Controllers\Admin;

use App\Models\QuestionBank;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class QuestionImportController extends Controller
{
    public function preview(Request $request, QuestionBank $questionBank)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        try {
            $file = $request->file('file');
            $handle = fopen($file->getRealPath(), 'r');

            if (!$handle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not open the file.',
                ], 400);
            }

            $header = fgetcsv($handle);
            if ($header === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'File is empty.',
                ], 400);
            }

            $preview = [];
            $errors = [];
            $rowNum = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (empty(array_filter($row))) {
                    continue;
                }

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
                    $errors[] = "Row {$rowNum}: {$e->getMessage()}";
                }
            }

            fclose($handle);

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
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        try {
            $file = $request->file('file');
            $handle = fopen($file->getRealPath(), 'r');

            if (!$handle) {
                return back()->withErrors(['file' => 'Could not open the file.']);
            }

            $header = fgetcsv($handle);
            if ($header === false) {
                return back()->withErrors(['file' => 'File is empty.']);
            }

            $created = 0;
            $failed = 0;
            $errors = [];
            $rowNum = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    $question_text = $row[0] ?? null;
                    $question_type = $row[1] ?? null;
                    $points = (int)($row[2] ?? 0);
                    $image_url = $row[3] ?? null;

                    if (empty($question_text)) {
                        throw new \Exception('Question text is required');
                    }

                    if (!in_array($question_type, ['multiple_choice', 'multiple_select', 'true_false'])) {
                        throw new \Exception('Invalid question type');
                    }

                    if ($points < 1 || $points > 45) {
                        throw new \Exception('Points must be between 1-45');
                    }

                    $options = $this->parseOptions($row, 4);

                    if (empty($options) || count($options) < 2) {
                        throw new \Exception('At least 2 options are required');
                    }

                    $hasCorrect = collect($options)->contains(fn($o) => $o['is_correct']);
                    if (!$hasCorrect) {
                        throw new \Exception('At least one correct answer required');
                    }

                    $question = $questionBank->questions()->create([
                        'question_text' => $question_text,
                        'question_type' => $question_type,
                        'points' => $points,
                        'image_url' => $image_url,
                    ]);

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
                    $errors[] = "Row {$rowNum}: {$e->getMessage()}";
                }
            }

            fclose($handle);

            return redirect()
                ->route('admin.question-banks.show', $questionBank->id)
                ->with('success', "Import completed! Created: {$created}, Failed: {$failed}")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    private function parseOptions($row, $startIndex)
    {
        $options = [];
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
                $part = substr($part, 1);
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
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}
