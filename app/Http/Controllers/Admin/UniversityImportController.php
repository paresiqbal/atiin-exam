<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UniversityImportController extends Controller
{
    public function preview(Request $request)
    {
        // Use validator so we can return JSON nicely
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('file'),
            ], 422);
        }

        try {
            $file = $request->file('file');

            $handle = fopen($file->getRealPath(), 'r');
            if (! $handle) {
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
            $errors  = [];
            $rowNum  = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                // Skip completely empty lines
                if (empty(array_filter($row))) {
                    continue;
                }

                // Trim all cells
                $row = array_map(
                    fn($value) => is_string($value) ? trim($value) : $value,
                    $row
                );

                // ✅ Skip helper/comment rows (first cell starts with "#")
                if (isset($row[0]) && is_string($row[0]) && str_starts_with($row[0], '#')) {
                    continue;
                }

                $item = [
                    'type'                  => $row[0] ?? null,
                    'name'                  => $row[1] ?? null,
                    'code'                  => $row[2] ?? null,
                    'city'                  => $row[3] ?? null,
                    'description'           => $row[4] ?? null,
                    'university_name'       => $row[5] ?? null,
                    'minimum_passing_grade' => $row[6] ?? null,
                ];


                $error = $this->validateRow($item);

                if ($error) {
                    $errors[] = "Row {$rowNum}: {$error}";
                } else {
                    $preview[] = array_merge(['row' => $rowNum], $item);
                }
            }

            fclose($handle);

            return response()->json([
                'success'    => true,
                'preview'    => $preview,
                'errors'     => $errors,
                'total_rows' => count($preview),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to parse file: {$e->getMessage()}",
            ], 400);
        }
    }

    public function import(Request $request)
    {
        // For fetch() we want JSON, but still keep redirect for classic form posts
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first('file'),
                ], 422);
            }

            return back()->withErrors($validator);
        }

        try {
            $file = $request->file('file');

            $handle = fopen($file->getRealPath(), 'r');
            if (! $handle) {
                if ($request->wantsJson() || $request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Could not open the file.',
                    ], 400);
                }

                return back()->withErrors(['file' => 'Could not open the file.']);
            }

            // Header row
            $header = fgetcsv($handle);
            if ($header === false) {
                if ($request->wantsJson() || $request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File is empty.',
                    ], 400);
                }

                return back()->withErrors(['file' => 'File is empty.']);
            }

            $createdUniversities = 0;
            $createdMajors       = 0;
            $failed              = 0;
            $errors              = [];
            $rowNum              = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (empty(array_filter($row))) {
                    continue;
                }

                // Trim cells
                $row = array_map(
                    fn($value) => is_string($value) ? trim($value) : $value,
                    $row
                );

                // ✅ Skip helper/comment rows
                if (isset($row[0]) && is_string($row[0]) && str_starts_with($row[0], '#')) {
                    continue;
                }

                $item = [
                    'type'                  => $row[0] ?? null,
                    'name'                  => $row[1] ?? null,
                    'code'                  => $row[2] ?? null,
                    'city'                  => $row[3] ?? null,
                    'description'           => $row[4] ?? null,
                    'university_name'       => $row[5] ?? null,
                    'minimum_passing_grade' => $row[6] ?? null,
                ];

                $error = $this->validateRow($item);

                if ($error) {
                    $failed++;
                    $errors[] = "Row {$rowNum}: {$error}";
                    continue;
                }

                if ($item['type'] === 'university') {
                    // Create / find university by name
                    $university = University::firstOrCreate(
                        ['name' => $item['name']],
                        [
                            'code'        => $item['code'],
                            'city'        => $item['city'],
                            'description' => $item['description'],
                            'website'     => null, // not part of CSV now
                        ]
                    );

                    // If it already existed, we don't increment created count
                    if ($university->wasRecentlyCreated) {
                        $createdUniversities++;
                    }
                } elseif ($item['type'] === 'major') {
                    $universityName = $item['university_name'];

                    $university = University::where('name', $universityName)->first();

                    if (! $university) {
                        $failed++;
                        $errors[] = "Row {$rowNum}: University not found: {$universityName}";
                        continue;
                    }

                    $minimumPassingGrade = (int) $item['minimum_passing_grade'];

                    $major = $university->majors()->firstOrCreate(
                        ['name' => $item['name']],
                        [
                            'description'           => $item['description'],
                            'minimum_passing_grade' => $minimumPassingGrade,
                        ]
                    );

                    if ($major->wasRecentlyCreated) {
                        $createdMajors++;
                    }
                } else {
                    $failed++;
                    $errors[] = "Row {$rowNum}: Invalid type (must be 'university' or 'major')";
                }
            }

            fclose($handle);

            // JSON response for SPA
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success'              => true,
                    'created_universities' => $createdUniversities,
                    'created_majors'       => $createdMajors,
                    'failed'               => $failed,
                    'errors'               => $errors,
                    'message'              => "Import completed! Universities: {$createdUniversities}, Majors: {$createdMajors}, Failed: {$failed}",
                ]);
            }

            // Fallback for non-AJAX
            return redirect()->route('admin.universities.index')
                ->with('success', "Import completed! Universities: {$createdUniversities}, Majors: {$createdMajors}, Failed: {$failed}")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "Import failed: {$e->getMessage()}",
                ], 400);
            }

            return back()->withErrors(['file' => "Import failed: {$e->getMessage()}"]);
        }
    }

    private function validateRow(array $data): ?string
    {
        if (! $data['type']) {
            return 'Type is required (university or major)';
        }

        if (! in_array($data['type'], ['university', 'major'], true)) {
            return 'Type must be "university" or "major"';
        }

        if (! $data['name']) {
            return 'Name is required';
        }

        if ($data['type'] === 'major') {
            if (! $data['university_name']) {
                return 'University name is required for major';
            }

            if ($data['minimum_passing_grade'] === null || $data['minimum_passing_grade'] === '') {
                return 'Minimum passing grade is required for major';
            }

            $grade = (int) $data['minimum_passing_grade'];

            if (!is_numeric($grade)) {
                return 'Minimum passing grade must be a number';
            }

            $grade = (float) $grade;

            if ($grade < 0) {
                return 'Invalid passing grade (min 0)';
            }
        }

        return null;
    }

    public function downloadTemplate()
    {
        $filename = 'universities_majors_import_template.csv';

        $handle = fopen('php://memory', 'w');

        fputcsv($handle, [
            'type',
            'name',
            'code',
            'city',
            'description',
            'university_name',
            'minimum_passing_grade',
        ]);

        fputcsv($handle, [
            '# university|major',
            '# required name (university or major)',
            '# optional for universities (short code, e.g. UI, ITB)',
            '# optional for universities (city, e.g. Jakarta)',
            '# optional description',
            '# for majors: parent university name EXACTLY as in "name"',
            '# for majors: minimum passing grade 0-100',
        ]);

        $rows = [
            ['university', 'Universitas Bengkulu', 'UNIB', 'Bengkulu', 'Universitas negeri di Bengkulu, Bengkulu', '', ''],
            ['university', 'Amikom Yogyakarta', 'AMIKOM', 'Yogyakarta', 'Universitas swasta di Yogyakarta', '', ''],
            ['major', 'Teknik Informatika', '', '', 'Program studi Teknik Informatika', 'Universitas Bengkulu', '80'],
            ['major', 'Teknik Elektro', '', '', 'Program studi Teknik Elektro', 'Amikom Yogyakarta', '78'],
        ];

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
