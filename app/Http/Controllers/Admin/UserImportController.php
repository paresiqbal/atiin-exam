<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserImportController extends Controller
{
    public function preview(Request $request)
    {
        // CSV / text only now
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

            // Rows: name, email, school_id, class
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                // Skip completely empty lines
                if (empty(array_filter($row))) {
                    continue;
                }

                $student = [
                    'name'      => $row[0] ?? null,
                    'email'     => $row[1] ?? null,
                    'school_id' => $row[2] ?? null,
                    'class'     => $row[3] ?? null,
                    'password'  => Str::random(10),
                    'role'      => 'student',
                ];

                $error = $this->validateRow($student);

                if ($error) {
                    $errors[] = "Row {$rowNum}: {$error}";
                } else {
                    $preview[] = array_merge(['row' => $rowNum], $student);
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

            $created = 0;
            $failed  = 0;
            $errors  = [];
            $rowNum  = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                if (empty(array_filter($row))) {
                    continue;
                }

                $student = [
                    'name'      => $row[0] ?? null,
                    'email'     => $row[1] ?? null,
                    'school_id' => $row[2] ?? null,
                    'class'     => $row[3] ?? null,
                    'password'  => Hash::make(Str::random(10)),
                    'role'      => 'student',
                ];

                $error = $this->validateRow($student);

                if ($error) {
                    $failed++;
                    $errors[] = "Row {$rowNum}: {$error}";
                    continue;
                }

                User::create($student);
                $created++;
            }

            fclose($handle);

            return redirect()->route('admin.users.index')
                ->with('success', "Import completed! Created: {$created}, Failed: {$failed}")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => "Import failed: {$e->getMessage()}"]);
        }
    }

    private function validateRow($data)
    {
        if (! $data['name']) {
            return 'Name is required';
        }

        if (! $data['email']) {
            return 'Email is required';
        }

        if (! filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Invalid email format';
        }

        if (User::where('email', $data['email'])->exists()) {
            return 'Email already exists';
        }

        if (! empty($data['school_id']) && ! School::where('id', $data['school_id'])->exists()) {
            return 'School not found';
        }

        return null;
    }

    public function downloadTemplate()
    {
        $filename = 'students_import_template.csv';

        $handle = fopen('php://memory', 'w');

        // Header row - must match import order
        fputcsv($handle, ['name', 'email', 'school_id', 'class']);

        // Helper row (only for humans, import skips it because we only skip the first row in code.
        // If you keep this helper row, remember that admins should delete it or we adjust the code.)
        fputcsv($handle, [
            '# required',
            '# required, must be unique & valid email',
            '# optional, use ID from school list',
            '# optional, e.g. 10A, 9B',
        ]);

        $exampleSchoolId = School::value('id') ?? 1;

        $rows = [
            ['John Doe', 'john@example.com', $exampleSchoolId, '10A'],
            ['Jane Smith', 'jane@example.com', $exampleSchoolId, '10B'],
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

    public function downloadSchoolList()
    {
        $filename = 'schools_reference.csv';

        $handle = fopen('php://memory', 'w');

        fputcsv($handle, ['id', 'name']);

        School::orderBy('name')->chunk(200, function ($schools) use ($handle) {
            foreach ($schools as $school) {
                fputcsv($handle, [$school->id, $school->name]);
            }
        });

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}
