<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\Request;

class UniversityImportController extends Controller
{
    public function preview(Request $request)
    {
        // CSV / text only now (same style as UserImportController)
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        try {
            $file = $request->file('file');

            $handle = fopen($file->getRealPath(), 'r');
            if (! $handle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not open the file.',
                ], 400);
            }

            // Header row
            $header = fgetcsv($handle);
            if ($header === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'File is empty.',
                ], 400);
            }

            $preview = [];
            $errors  = [];
            $rowNum  = 1; // header row

            // Expected order:
            // 0 => type (university|major)
            // 1 => name
            // 2 => code
            // 3 => city
            // 4 => description
            // 5 => university_name (for majors)
            // 6 => minimum_passing_grade (for majors)
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                // Skip completely empty lines
                if (empty(array_filter($row))) {
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
        // CSV / text only now
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        try {
            $file = $request->file('file');

            $handle = fopen($file->getRealPath(), 'r');
            if (! $handle) {
                return back()->withErrors(['file' => 'Could not open the file.']);
            }

            // Header row
            $header = fgetcsv($handle);
            if ($header === false) {
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

                    $createdUniversities++;
                } elseif ($item['type'] === 'major') {
                    $universityName = $item['university_name'];

                    $university = University::where('name', $universityName)->first();

                    if (! $university) {
                        $failed++;
                        $errors[] = "Row {$rowNum}: University not found: {$universityName}";
                        continue;
                    }

                    $minimumPassingGrade = (int) $item['minimum_passing_grade'];

                    $university->majors()->firstOrCreate(
                        ['name' => $item['name']],
                        [
                            'description'            => $item['description'],
                            'minimum_passing_grade'  => $minimumPassingGrade,
                        ]
                    );

                    $createdMajors++;
                } else {
                    $failed++;
                    $errors[] = "Row {$rowNum}: Invalid type (must be 'university' or 'major')";
                }
            }

            fclose($handle);

            return redirect()->route('admin.universities.index')
                ->with('success', "Import completed! Universities: {$createdUniversities}, Majors: {$createdMajors}, Failed: {$failed}")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
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

            if ($grade < 0 || $grade > 100) {
                return 'Invalid passing grade (0-100)';
            }
        }

        // Optional: you can also enforce code or city when type=university, if needed
        // if ($data['type'] === 'university' && ! $data['code']) {
        //     return 'Code is required for university';
        // }

        return null;
    }

    public function downloadTemplate()
    {
        $filename = 'universities_majors_import_template.csv';

        $handle = fopen('php://memory', 'w');

        // Header row - must match import order
        fputcsv($handle, [
            'type',
            'name',
            'code',
            'city',
            'description',
            'university_name',
            'minimum_passing_grade',
        ]);

        // Helper row (for humans)
        fputcsv($handle, [
            '# university|major',
            '# required name',
            '# optional (for universities)',
            '# optional (for universities)',
            '# optional description',
            '# for majors: parent university name',
            '# for majors: 0-100',
        ]);

        // Example rows
        $rows = [
            ['university', 'Harvard University', 'HARV', 'Cambridge', 'Leading research university', '', ''],
            ['university', 'MIT', 'MIT', 'Cambridge', 'Massachusetts Institute of Technology', '', ''],
            ['major', 'Computer Science', '', '', 'Study of computation', 'Harvard University', '75'],
            ['major', 'Engineering', '', '', 'Various engineering disciplines', 'MIT', '80'],
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
