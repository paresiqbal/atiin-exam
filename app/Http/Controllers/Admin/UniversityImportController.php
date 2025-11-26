<?php

namespace App\Http\Controllers\Admin;

use App\Models\University;
use App\Models\Major;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Maatwebsite\Excel\Facades\Excel;

class UniversityImportController extends Controller
{
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            $file = $request->file('file');
            $rows = Excel::toArray(null, $file);

            if (empty($rows) || empty($rows[0])) {
                return back()->withErrors(['file' => 'File is empty']);
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
                        'type' => $row[0] ?? null, // 'university' or 'major'
                        'name' => $row[1] ?? null,
                        'description' => $row[2] ?? null,
                        'university_name' => $row[3] ?? null, // For majors
                        'minimum_passing_grade' => $row[4] ?? null, // For majors
                    ];

                    $this->validateImportRow($item, $rowNum, $errors);
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

    public function import(Request $request)
    {
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

            $created_universities = 0;
            $created_majors = 0;
            $failed = 0;
            $errors = [];

            foreach ($data as $index => $row) {
                if (empty(array_filter($row))) continue;

                $rowNum = $index + 2;

                try {
                    $type = $row[0] ?? null;

                    if ($type === 'university') {
                        $university = University::firstOrCreate(
                            ['name' => $row[1]],
                            [
                                'description' => $row[2] ?? null,
                                'website' => $row[3] ?? null,
                            ]
                        );
                        $created_universities++;
                    } elseif ($type === 'major') {
                        $university = University::where('name', $row[3])->first();

                        if (!$university) {
                            throw new \Exception('University not found: ' . $row[3]);
                        }

                        $minimum_passing_grade = (int)($row[4] ?? 0);

                        if ($minimum_passing_grade < 0 || $minimum_passing_grade > 100) {
                            throw new \Exception('Invalid passing grade (0-100)');
                        }

                        $university->majors()->firstOrCreate(
                            ['name' => $row[1]],
                            [
                                'description' => $row[2] ?? null,
                                'minimum_passing_grade' => $minimum_passing_grade,
                            ]
                        );
                        $created_majors++;
                    } else {
                        throw new \Exception('Invalid type. Use "university" or "major"');
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Row $rowNum: {$e->getMessage()}";
                }
            }

            return redirect()->route('admin.universities.index')
                ->with('success', "Import completed! Universities: $created_universities, Majors: $created_majors, Failed: $failed")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    private function validateImportRow($data, $rowNum, &$errors)
    {
        if (empty($data['type'])) {
            throw new \Exception('Type is required (university or major)');
        }

        if (!in_array($data['type'], ['university', 'major'])) {
            throw new \Exception('Type must be "university" or "major"');
        }

        if (empty($data['name'])) {
            throw new \Exception('Name is required');
        }

        if ($data['type'] === 'major') {
            if (empty($data['university_name'])) {
                throw new \Exception('University name is required for major');
            }

            if ($data['minimum_passing_grade'] === null) {
                throw new \Exception('Minimum passing grade is required for major');
            }

            if ((int)$data['minimum_passing_grade'] < 0 || (int)$data['minimum_passing_grade'] > 100) {
                throw new \Exception('Invalid passing grade (0-100)');
            }
        }
    }

    public function downloadTemplate()
    {
        $headers = ['Type', 'Name', 'Description', 'University Name', 'Minimum Passing Grade'];
        $rows = [
            ['university', 'Harvard University', 'Leading research university', '', ''],
            ['university', 'MIT', 'Massachusetts Institute of Technology', '', ''],
            ['major', 'Computer Science', 'Study of computation', 'Harvard University', '75'],
            ['major', 'Engineering', 'Various engineering disciplines', 'MIT', '80'],
        ];

        $filename = 'universities_majors_import_template.csv';
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
