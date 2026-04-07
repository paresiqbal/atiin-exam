<?php

namespace App\Services;

use App\Models\Exam;
use App\Support\PhpSpreadsheet\FileCache;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Settings;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
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
    private const ATTIN_FORMULA = 1525.0;

    public function export(Exam $exam): string
    {
        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions',
        ]);

        $banks = $exam->questionBanks;
        $bankMeta = $banks->map(function ($bank) {
            return [
                'name' => $bank->name,
                'question_ids' => $bank->questions->pluck('id')->all(),
                'total' => $bank->questions->count(),
                'max_score' => self::MAX_SCORE,
            ];
        })->values()->all();

        $rows = [];

        $exam->attempts()
            ->where('status', 'submitted')
            ->with([
                'student:id,name',
                'responses:id,exam_attempt_id,question_id,selected_option_id',
                'responses.selectedOption:id,is_correct',
            ])
            ->orderBy('id')
            ->chunkById(100, function ($attempts) use (&$rows, $bankMeta) {
                foreach ($attempts as $attempt) {
                    $byQuestion = $attempt->responses->keyBy('question_id');
                    $blockCorrect = [];
                    $blockScore = [];

                    foreach ($bankMeta as $meta) {
                        $correct = 0;

                        foreach ($meta['question_ids'] as $questionId) {
                            $response = $byQuestion->get($questionId);

                            if ($response?->selectedOption?->is_correct) {
                                $correct++;
                            }
                        }

                        $blockCorrect[$meta['name']] = $correct;
                        $blockScore[$meta['name']] = $meta['total'] > 0
                            ? round(($correct / $meta['total']) * $meta['max_score'], 10)
                            : 0.0;
                    }

                    $rows[] = [
                        'student_id' => $attempt->student_id,
                        'student_name' => $attempt->student?->name ?? '-',
                        'block_correct' => $blockCorrect,
                        'block_score' => $blockScore,
                        'total_skor' => array_sum($blockScore),
                    ];
                }
            });

        usort($rows, fn (array $left, array $right) => $right['total_skor'] <=> $left['total_skor']);

        return $this->buildSpreadsheet($exam, $banks, $rows);
    }

    private function buildSpreadsheet(Exam $exam, Collection $banks, array $rows): string
    {
        $tempDir = storage_path('app/temp');
        $cellCacheDir = $tempDir . DIRECTORY_SEPARATOR . 'phpspreadsheet-cells';
        $writerCacheDir = $tempDir . DIRECTORY_SEPARATOR . 'phpspreadsheet-writer';
        $path = $tempDir . DIRECTORY_SEPARATOR . 'irt_export_' . $exam->id . '_' . time() . '.xlsx';

        foreach ([$tempDir, $cellCacheDir, $writerCacheDir] as $directory) {
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
        }

        $previousCache = Settings::getCache();
        Settings::setCache(new FileCache($cellCacheDir));

        $spreadsheet = new Spreadsheet();

        try {
            $worksheet = $spreadsheet->getActiveSheet();
            $worksheet->setTitle('Hasil IRT');

            $bankNames = $banks->pluck('name')->all();
            $blockCount = count($bankNames);
            $colCorrectStart = 5;
            $colScoreStart = $colCorrectStart + $blockCount;
            $colTotalSkor = $colScoreStart + $blockCount;
            $colSkorUtbk = $colTotalSkor + 1;
            $colSkorPct = $colSkorUtbk + 1;
            $colRanking = $colSkorPct + 1;
            $lastCol = $colRanking;

            $dateStr = $exam->end_at
                ? 'Hari/ Tanggal : ' . \Carbon\Carbon::parse($exam->end_at)->translatedFormat('l, d F Y')
                : 'Hari/ Tanggal : -';
            $worksheet->setCellValue('B3', $dateStr);
            $worksheet->getStyle('B3')->getFont()->setBold(true)->setSize(11)->setName('Arial');

            $correctStartLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart);
            $correctEndLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $blockCount - 1);
            $scoreStartLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart);
            $scoreEndLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $blockCount - 1);
            $totalSkorLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colTotalSkor);
            $rankingLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colRanking);

            $worksheet->setCellValue("{$correctStartLetter}4", 'JUMLAH SOAL BENAR (PER BLOCK)');
            $worksheet->mergeCells("{$correctStartLetter}4:{$correctEndLetter}4");
            $worksheet->setCellValue("{$scoreStartLetter}4", 'HASIL SKOR (PER BLOCK)');
            $worksheet->mergeCells("{$scoreStartLetter}4:{$scoreEndLetter}4");

            $this->styleGroupHeader($worksheet, "{$correctStartLetter}4:{$correctEndLetter}4", 'D9E1F2');
            $this->styleGroupHeader($worksheet, "{$scoreStartLetter}4:{$scoreEndLetter}4", 'E2EFDA');

            $worksheet->setCellValue('B5', 'No.');
            $worksheet->setCellValue('C5', 'NAMA SISWA');
            $worksheet->setCellValue('D5', 'USER ID');

            foreach ($bankNames as $index => $name) {
                $correctColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $index);
                $scoreColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $index);
                $worksheet->setCellValue("{$correctColumn}5", $name);
                $worksheet->setCellValue("{$scoreColumn}5", $name);
            }

            $worksheet->setCellValue("{$totalSkorLetter}5", 'TOTAL SKOR');
            $worksheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorUtbk) . '5', 'SKOR UTBK');
            $worksheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct) . '5', 'SKOR UTBK (%)');
            $worksheet->setCellValue("{$rankingLetter}5", 'RANGKING');

            $headerRange = "B5:{$rankingLetter}5";
            $worksheet->getStyle($headerRange)->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'name' => 'Arial'],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);
            $worksheet->getRowDimension(5)->setRowHeight(30);

            foreach ($rows as $rowIndex => $data) {
                $excelRow = $rowIndex + 6;
                $rank = $rowIndex + 1;
                $skorUtbk = $blockCount > 0 ? $data['total_skor'] / $blockCount : 0;
                $pct = round(($skorUtbk / self::ATTIN_FORMULA) * 100, 2);

                $worksheet->setCellValue("B{$excelRow}", $rank);
                $worksheet->setCellValue("C{$excelRow}", $data['student_name']);
                $worksheet->setCellValue("D{$excelRow}", $data['student_id']);

                foreach ($bankNames as $index => $name) {
                    $correctColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCorrectStart + $index);
                    $scoreColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colScoreStart + $index);

                    $worksheet->setCellValue("{$correctColumn}{$excelRow}", $data['block_correct'][$name] ?? 0);
                    $worksheet->getStyle("{$correctColumn}{$excelRow}")->getNumberFormat()->setFormatCode('0');

                    $worksheet->setCellValue("{$scoreColumn}{$excelRow}", $data['block_score'][$name] ?? 0);
                    $worksheet->getStyle("{$scoreColumn}{$excelRow}")->getNumberFormat()->setFormatCode('0.00');
                }

                $worksheet->setCellValue("{$totalSkorLetter}{$excelRow}", $data['total_skor']);
                $worksheet->getStyle("{$totalSkorLetter}{$excelRow}")->getNumberFormat()->setFormatCode('0.00');

                $worksheet->setCellValue(
                    \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorUtbk) . $excelRow,
                    $skorUtbk
                );
                $worksheet->getStyle(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorUtbk) . $excelRow)
                    ->getNumberFormat()->setFormatCode('0.00');

                $worksheet->setCellValue(
                    \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct) . $excelRow,
                    $pct
                );
                $worksheet->getStyle(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colSkorPct) . $excelRow)
                    ->getNumberFormat()->setFormatCode('0.00"%"');

                $worksheet->setCellValue("{$rankingLetter}{$excelRow}", $rank);

                $background = $rowIndex % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
                $worksheet->getStyle("B{$excelRow}:{$rankingLetter}{$excelRow}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $background]],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D0D0D0']]],
                    'font' => ['size' => 10, 'name' => 'Arial'],
                ]);
                $worksheet->getStyle("{$correctStartLetter}{$excelRow}:{$rankingLetter}{$excelRow}")
                    ->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }

            $worksheet->getColumnDimension('B')->setWidth(6);
            $worksheet->getColumnDimension('C')->setWidth(28);
            $worksheet->getColumnDimension('D')->setWidth(10);
            foreach (range($colCorrectStart, $lastCol) as $columnIndex) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex);
                $worksheet->getColumnDimension($column)->setWidth(10);
            }
            $worksheet->getColumnDimension($totalSkorLetter)->setWidth(13);

            $writer = new Xlsx($spreadsheet);
            $writer->setUseDiskCaching(true, $writerCacheDir);
            $writer->setPreCalculateFormulas(false);
            $writer->save($path);
        } finally {
            $spreadsheet->disconnectWorksheets();
            unset($spreadsheet);
            Settings::setCache($previousCache);
            gc_collect_cycles();
        }

        return $path;
    }

    private function styleGroupHeader(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $worksheet, string $range, string $bgColor): void
    {
        $worksheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'name' => 'Arial'],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            'borders' => ['outline' => ['borderStyle' => Border::BORDER_MEDIUM]],
        ]);
    }
}
