<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class IrtExportService
{
    /**
     * Max UTBK score per block. Keys must match question_bank names exactly.
     * Adjust these values to match the client's official scoring scale.
     *
     * Formula used: block_score = (correct / total_in_block) * MAX_SCORE[block]
     *
     * Based on the example file, all blocks appear to scale to ~1000.
     * Confirm exact max values with the client if needed.
     */
    private const MAX_SCORE = 1000.0;

    public function export(Exam $exam): string
    {
        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions',
        ]);

        // Each question bank = one block (PU, PBM, PPU, etc.)
        $banks = $exam->questionBanks;

        // Map: bank_id → [name, question_ids[], total_questions]
        $bankMeta = $banks->mapWithKeys(function ($bank) {
            return [$bank->id => [
                'name'       => $bank->name,
                'question_ids' => $bank->questions->pluck('id')->all(),
                'total'      => $bank->questions->count(),
                // Optional: store a custom max_score on the question_bank model
                // and use: 'max_score' => $bank->max_score ?? self::MAX_SCORE
                'max_score'  => self::MAX_SCORE,
            ]];
        });

        // Load all submitted attempts with responses
        $attempts = $exam->attempts()
            ->where('status', 'submitted')
            ->with(['responses.selectedOption', 'student'])
            ->get()
            ->values();

        // Build per-attempt data
        $rows = $attempts->map(function ($attempt) use ($bankMeta) {
            $byQuestion = $attempt->responses->keyBy('question_id');

            $blockCorrect = [];
            $blockScore   = [];

            foreach ($bankMeta as $bankId => $meta) {
                $correct = 0;
                foreach ($meta['question_ids'] as $qid) {
                    $response = $byQuestion->get($qid);
                    if ($response?->selectedOption?->is_correct) {
                        $correct++;
                    }
                }
                $blockCorrect[$meta['name']] = $correct;
                $blockScore[$meta['name']]   = $meta['total'] > 0
                    ? round(($correct / $meta['total']) * $meta['max_score'], 10)
                    : 0.0;
            }

            $totalSkor = array_sum($blockScore);

            return [
                'student_id'    => $attempt->student?->id ?? $attempt->user_id,
                'student_name'  => $attempt->student?->name ?? '-',
                'block_correct' => $blockCorrect,
                'block_score'   => $blockScore,
                'total_skor'    => $totalSkor,
                'theta'         => $attempt->irt_theta,
            ];
        });

        // Sort by total_skor descending → determines RANGKING
        $sorted = $rows->sortByDesc('total_skor')->values();

        return $this->buildSpreadsheet($exam, $banks, $sorted);
    }

    private function buildSpreadsheet(Exam $exam, Collection $banks, Collection $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $ws          = $spreadsheet->getActiveSheet();
        $ws->setTitle('Hasil IRT');

        $bankNames  = $banks->pluck('name')->all();
        $blockCount = count($bankNames);

        // ── Column layout ────────────────────────────────────────────────────
        // B: No.   C: NAMA SISWA   D: USER ID
        // E…(E+blockCount-1): correct per block
        // (E+blockCount)…(E+2*blockCount-1): score per block
        // then: TOTAL SKOR | SKOR UTBK | SKOR UTBK (%) | RANGKING
        $colNo        = 'B';
        $colName      = 'C';
        $colUserId    = 'D';
        $colCorrectStart = 5;                          // column E (1-indexed)
        $colScoreStart   = $colCorrectStart + $blockCount;
        $colTotalSkor    = $colScoreStart + $blockCount;
        $colSkorUtbk     = $colTotalSkor + 1;
        $colSkorPct      = $colSkorUtbk + 1;
        $colRangking     = $colSkorPct + 1;
        $lastCol         = $colRangking;

        // ── Row 3: date ──────────────────────────────────────────────────────
        $dateStr = $exam->end_at
            ? 'Hari/ Tanggal : ' . \Carbon\Carbon::parse($exam->end_at)->translatedFormat('l, d F Y')
            : 'Hari/ Tanggal : -';
        $ws->setCellValue('B3', $dateStr);
        $ws->getStyle('B3')->getFont()->setBold(true)->setSize(11)->setName('Arial');

        // ── Row 4: group headers (merged) ────────────────────────────────────
        $correctStartLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart);
        $correctEndLetter   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $blockCount - 1);
        $scoreStartLetter   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart);
        $scoreEndLetter     = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $blockCount - 1);
        $totalSkorLetter    = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colTotalSkor);
        $rankLetter         = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colRangking);

        $ws->setCellValue("{$correctStartLetter}4", 'JUMLAH SOAL BENAR (PER BLOCK)');
        $ws->mergeCells("{$correctStartLetter}4:{$correctEndLetter}4");

        $ws->setCellValue("{$scoreStartLetter}4", 'HASIL SKOR (PER BLOCK)');
        $ws->mergeCells("{$scoreStartLetter}4:{$scoreEndLetter}4");

        $this->styleGroupHeader($ws, "{$correctStartLetter}4:{$correctEndLetter}4", 'D9E1F2');
        $this->styleGroupHeader($ws, "{$scoreStartLetter}4:{$scoreEndLetter}4", 'E2EFDA');

        // ── Row 5: column headers ─────────────────────────────────────────────
        $ws->setCellValue('B5', 'No.');
        $ws->setCellValue('C5', 'NAMA SISWA');
        $ws->setCellValue('D5', 'USER ID');

        foreach ($bankNames as $i => $name) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $i);
            $ws->setCellValue("{$col}5", $name);
        }
        foreach ($bankNames as $i => $name) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $i);
            $ws->setCellValue("{$col}5", $name);
        }

        $ws->setCellValue("{$totalSkorLetter}5", 'TOTAL SKOR');
        $ws->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorUtbk)  . '5', 'SKOR UTBK');
        $ws->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct)   . '5', 'SKOR UTBK (%)');
        $ws->setCellValue("{$rankLetter}5", 'RANGKING');

        // Style header row 5
        $headerRange = "B5:{$rankLetter}5";
        $ws->getStyle($headerRange)->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'name' => 'Arial'],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
        $ws->getRowDimension(5)->setRowHeight(30);

        // ── Data rows starting at row 6 ───────────────────────────────────────
        $maxTotalSkor = $rows->max('total_skor') ?: 1;

        foreach ($rows as $rowIdx => $data) {
            $excelRow = $rowIdx + 6;
            $rank     = $rowIdx + 1;

            $ws->setCellValue("B{$excelRow}", $rank);
            $ws->setCellValue("C{$excelRow}", $data['student_name']);
            $ws->setCellValue("D{$excelRow}", $data['student_id']);

            foreach ($bankNames as $i => $name) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $i);
                $ws->setCellValue("{$col}{$excelRow}", $data['block_correct'][$name] ?? 0);
                $ws->getStyle("{$col}{$excelRow}")->getNumberFormat()->setFormatCode('0');
            }

            foreach ($bankNames as $i => $name) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $i);
                $ws->setCellValue("{$col}{$excelRow}", $data['block_score'][$name] ?? 0);
                $ws->getStyle("{$col}{$excelRow}")->getNumberFormat()->setFormatCode('0.00');
            }

            $ws->setCellValue("{$totalSkorLetter}{$excelRow}", $data['total_skor']);
            $ws->getStyle("{$totalSkorLetter}{$excelRow}")->getNumberFormat()->setFormatCode('0.00');

            // SKOR UTBK: leave for client to confirm formula — filled as blank for now
            $ws->setCellValue(
                \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorUtbk) . $excelRow,
                ''
            );

            // SKOR UTBK (%): total_skor as percentage of max possible
            $pct = $maxTotalSkor > 0 ? round(($data['total_skor'] / ($blockCount * self::MAX_SCORE)) * 100, 2) : 0;
            $ws->setCellValue(
                \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct) . $excelRow,
                $pct
            );
            $ws->getStyle(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct) . $excelRow)
                ->getNumberFormat()->setFormatCode('0.00"%"');

            $ws->setCellValue("{$rankLetter}{$excelRow}", $rank);

            // Zebra rows
            $bg = $rowIdx % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
            $ws->getStyle("B{$excelRow}:{$rankLetter}{$excelRow}")->applyFromArray([
                'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D0D0D0']]],
                'font'    => ['size' => 10, 'name' => 'Arial'],
            ]);

            // Center numeric columns
            $numRange = "{$correctStartLetter}{$excelRow}:{$rankLetter}{$excelRow}";
            $ws->getStyle($numRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // ── Column widths ─────────────────────────────────────────────────────
        $ws->getColumnDimension('B')->setWidth(6);   // No.
        $ws->getColumnDimension('C')->setWidth(28);  // NAMA SISWA
        $ws->getColumnDimension('D')->setWidth(10);  // USER ID
        foreach (range($colCorrectStart, $lastCol) as $ci) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($ci);
            $ws->getColumnDimension($col)->setWidth(10);
        }
        // Wider for TOTAL SKOR
        $ws->getColumnDimension($totalSkorLetter)->setWidth(13);

        // ── Save to temp file ─────────────────────────────────────────────────
        $path = storage_path('app/temp/irt_export_' . $exam->id . '_' . time() . '.xlsx');
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        (new Xlsx($spreadsheet))->save($path);

        return $path;
    }

    private function styleGroupHeader(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, string $range, string $bgColor): void
    {
        $ws->getStyle($range)->applyFromArray([
            'font'      => ['bold' => true, 'size' => 11, 'name' => 'Arial'],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            'borders'   => ['outline' => ['borderStyle' => Border::BORDER_MEDIUM]],
        ]);
    }
}
