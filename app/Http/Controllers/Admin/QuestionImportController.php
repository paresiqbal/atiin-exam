<?php

namespace App\Http\Controllers\Admin;

use App\Models\QuestionBank;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use PhpOffice\PhpSpreadsheet\IOFactory;

class QuestionImportController extends Controller
{
    // ── Public endpoints ──────────────────────────────────────────────────────

    public function preview(Request $request, QuestionBank $questionBank)
    {
        $request->validate([
            'file' => 'required|file|max:5120|mimes:csv,txt,xls,xlsx,ods',
        ]);

        try {
            $rows   = $this->readFile($request->file('file'));
            $header = array_shift($rows);

            if (!$header) {
                return response()->json(['success' => false, 'message' => 'File is empty.'], 400);
            }

            [$qtIdx, $typeIdx, $ptsIdx, $imgIdx, $optIdx] = $this->resolveIndexes($header);

            $preview = [];
            $errors  = [];
            $rowNum  = 1;

            foreach ($rows as $row) {
                $rowNum++;
                if (empty(array_filter($row, fn($v) => $v !== null && $v !== ''))) continue;

                try {
                    $item = [
                        'question_text' => $row[$qtIdx]   ?? null,
                        'question_type' => $row[$typeIdx] ?? null,
                        'points'        => $row[$ptsIdx]  ?? null,
                        'image_url'     => $row[$imgIdx]  ?? null,
                        'options'       => $this->parseOptions($row, $optIdx),
                    ];
                    $this->validateQuestion($item, $rowNum, $errors);
                    $preview[] = array_merge(['row' => $rowNum], $item);
                } catch (\Exception $e) {
                    $errors[] = "Row {$rowNum}: {$e->getMessage()}";
                }
            }

            return response()->json([
                'success'    => true,
                'preview'    => $preview,
                'errors'     => $errors,
                'total_rows' => count($preview),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to parse file: ' . $e->getMessage()], 400);
        }
    }

    public function import(Request $request, QuestionBank $questionBank)
    {
        $request->validate([
            'file' => 'required|file|max:5120|mimes:csv,txt,xls,xlsx,ods',
        ]);

        try {
            $rows   = $this->readFile($request->file('file'));
            $header = array_shift($rows);

            if (!$header) {
                return back()->withErrors(['file' => 'File is empty.']);
            }

            [$qtIdx, $typeIdx, $ptsIdx, $imgIdx, $optIdx] = $this->resolveIndexes($header);

            $created = 0;
            $failed  = 0;
            $errors  = [];
            $rowNum  = 1;

            foreach ($rows as $row) {
                $rowNum++;
                if (empty(array_filter($row, fn($v) => $v !== null && $v !== ''))) continue;

                try {
                    $question_text = $row[$qtIdx]   ?? null;
                    $question_type = $row[$typeIdx] ?? null;
                    $points        = (int) ($row[$ptsIdx] ?? 0);
                    $image_url     = $row[$imgIdx]  ?? null;

                    if (empty($question_text)) throw new \Exception('Question text is required');

                    if (!in_array($question_type, ['multiple_choice', 'multiple_select', 'true_false'])) {
                        throw new \Exception('Invalid question type: ' . $question_type);
                    }

                    if ($points < 1 || $points > 45) throw new \Exception('Points must be 1–45');

                    $options = $this->parseOptions($row, $optIdx);

                    if (count($options) < 2)                                   throw new \Exception('At least 2 options required');
                    if (!collect($options)->contains(fn($o) => $o['is_correct'])) throw new \Exception('At least one correct answer required');

                    $question = $questionBank->questions()->create([
                        'question_text' => $question_text,
                        'question_type' => $question_type,
                        'points'        => $points,
                        'image_url'     => $image_url,
                    ]);

                    foreach ($options as $i => $opt) {
                        QuestionOption::create([
                            'question_id'  => $question->id,
                            'option_text'  => $opt['text'],
                            'is_correct'   => $opt['is_correct'],
                            'option_order' => $i,
                        ]);
                    }

                    $created++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Row {$rowNum}: {$e->getMessage()}";
                }
            }

            return redirect()
                ->route('admin.question-banks.show', $questionBank->id)
                ->with('success', "Import selesai! Berhasil: {$created}, Gagal: {$failed}")
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function downloadTemplate()
    {
        $headers = [
            'Question Text / Teks Soal',
            'Type / Tipe',
            'Points / Poin',
            'Image URL / URL Gambar',
            'Options (use | to separate, * for correct / gunakan | untuk memisahkan, * untuk jawaban benar)',
        ];

        $rows = [
            ['Berapa hasil 2+2?',               'multiple_choice', 5,  '', '*4|3|5|6'],
            ['Apakah langit berwarna biru?',     'true_false',      3,  '', '*Ya|Tidak'],
            ['Mana yang merupakan buah-buahan?', 'multiple_select', 10, '', '*Apel|Wortel|*Pisang|Brokoli'],
        ];

        $handle = fopen('php://memory', 'w');
        fwrite($handle, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel opens correctly
        fputcsv($handle, $headers);
        foreach ($rows as $row) fputcsv($handle, $row);
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="questions_import_template.csv"');
    }

    // ── Core file reader ──────────────────────────────────────────────────────

    /**
     * Read any supported format (CSV, XLS, XLSX, ODS) and return
     * a 2-D array of strings. All values are cast to string so downstream
     * code never receives typed PHP values (int, float, bool) from spreadsheet cells.
     */
    private function readFile(\Illuminate\Http\UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['xls', 'xlsx', 'ods'])) {
            return $this->readSpreadsheet($file);
        }

        // CSV / TXT — handle encoding first
        return $this->readCsv($file);
    }

    private function readSpreadsheet(\Illuminate\Http\UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet       = $spreadsheet->getActiveSheet();
        $rows        = [];

        foreach ($sheet->getRowIterator() as $row) {
            $cells = [];
            foreach ($row->getCellIterator() as $cell) {
                // Use formatted value so dates/numbers look like what the user typed
                $cells[] = (string) $cell->getFormattedValue();
            }

            // Trim trailing empty cells but keep at least one element
            while (count($cells) > 1 && end($cells) === '') {
                array_pop($cells);
            }

            $rows[] = $cells;
        }

        return $rows;
    }

    private function readCsv(\Illuminate\Http\UploadedFile $file): array
    {
        $raw = file_get_contents($file->getRealPath());

        // Strip UTF-8 BOM
        if (str_starts_with($raw, "\xEF\xBB\xBF")) {
            $raw = substr($raw, 3);
        }

        // Convert non-UTF-8 encodings (common with Excel-saved CSVs on Windows)
        if (!mb_check_encoding($raw, 'UTF-8')) {
            $detected = mb_detect_encoding($raw, ['Windows-1252', 'ISO-8859-1', 'Windows-1254'], true);
            $raw      = mb_convert_encoding($raw, 'UTF-8', $detected ?: 'Windows-1252');
        }

        $tmp = tempnam(sys_get_temp_dir(), 'qimport_');
        file_put_contents($tmp, $raw);

        $rows   = [];
        $handle = fopen($tmp, 'r');
        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = array_map('strval', $row);
        }
        fclose($handle);
        @unlink($tmp);

        return $rows;
    }

    // ── Column detection ──────────────────────────────────────────────────────

    private function resolveIndexes(array $header): array
    {
        $indexes   = $this->detectColumnIndexes($header);

        return [
            $this->resolveColumnIndex($indexes, 'question_text', 0),
            $this->resolveColumnIndex($indexes, 'question_type', 1),
            $this->resolveColumnIndex($indexes, 'points',        2),
            $this->resolveColumnIndex($indexes, 'image_url',     3),
            $this->resolveColumnIndex($indexes, 'options',       4),
        ];
    }

    private function detectColumnIndexes(array $header): array
    {
        $aliases = [
            'question_text' => ['question text', 'question_text', 'teks soal', 'soal', 'pertanyaan'],
            'question_type' => ['type', 'question type', 'question_type', 'tipe', 'jenis'],
            'points'        => ['points', 'point', 'poin', 'nilai', 'skor'],
            'image_url'     => ['image url', 'image_url', 'url gambar', 'gambar', 'url image'],
            'options'       => [
                'options (use | to separate, * for correct / gunakan | untuk memisahkan, * untuk jawaban benar)',
                'options (use | to separate, * for correct)',
                'options',
                'pilihan',
                'opsi',
                'choices',
                'jawaban',
                'option',
            ],
        ];

        $normalized = array_map(fn($v) => strtolower(trim($v)), $header);
        $indexes    = [];

        foreach ($aliases as $key => $names) {
            foreach ($normalized as $idx => $value) {
                if (in_array($value, $names, true)) {
                    $indexes[$key] = $idx;
                    break;
                }
            }
        }

        return $indexes;
    }

    private function resolveColumnIndex(array $indexes, string $key, int $default): int
    {
        return $indexes[$key] ?? $default;
    }

    // ── Option parser ─────────────────────────────────────────────────────────

    private function parseOptions(array $row, int $startIndex): array
    {
        $raw = trim($row[$startIndex] ?? '');
        if ($raw === '') return [];

        $options = [];
        foreach (explode('|', $raw) as $part) {
            $part = trim($part);
            if ($part === '') continue;

            $is_correct = str_starts_with($part, '*');
            if ($is_correct) $part = substr($part, 1);

            $options[] = ['text' => $part, 'is_correct' => $is_correct];
        }

        return $options;
    }

    // ── Validator ─────────────────────────────────────────────────────────────

    private function validateQuestion(array $q, int $rowNum, array &$errors): void
    {
        if (empty($q['question_text'])) throw new \Exception('Question text is required');

        if (!in_array($q['question_type'], ['multiple_choice', 'multiple_select', 'true_false'])) {
            throw new \Exception('Invalid type: ' . $q['question_type']);
        }

        if ((int) $q['points'] < 1 || (int) $q['points'] > 45) {
            throw new \Exception('Points must be 1–45');
        }

        if (count($q['options']) < 2) throw new \Exception('Need at least 2 options');

        if (!collect($q['options'])->contains(fn($o) => $o['is_correct'])) {
            throw new \Exception('At least one correct answer required');
        }
    }
}
