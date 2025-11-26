<?php

namespace App\Exports;

use App\Models\Exam;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExamResultsExport implements FromCollection, WithHeadings, WithStyles
{
    private $exam;

    public function __construct(Exam $exam)
    {
        $this->exam = $exam;
    }

    public function collection()
    {
        // Get all attempts for this exam with student info
        $attempts = $this->exam->attempts()
            ->with('student.university', 'student.major', 'student.school', 'responses.question')
            ->get();

        $questions = $this->exam->questionBank->questions()->orderBy('id')->get();

        $rows = [];

        foreach ($attempts as $attempt) {
            $student = $attempt->student;

            // Base student info
            $row = [
                'Name' => $student->name,
                'Email' => $student->email,
                'School' => $student->school?->name ?? 'N/A',
                'Class' => $student->class ?? 'N/A',
                'University' => $student->university?->name ?? 'N/A',
                'Major' => $student->major?->name ?? 'N/A',
            ];

            // Add each question result (correct/wrong)
            foreach ($questions as $question) {
                $response = $attempt->responses()
                    ->where('question_id', $question->id)
                    ->first();

                $isCorrect = $response && $response->selectedOption && $response->selectedOption->is_correct;
                $row["Q{$question->id}"] = $isCorrect ? 'Correct' : 'Wrong';
            }

            // Add total score
            $row['Total Score'] = "{$attempt->score}/{$attempt->total_score}";
            $row['Percentage'] = $attempt->total_score > 0
                ? round(($attempt->score / $attempt->total_score) * 100, 2) . '%'
                : '0%';

            // Add passing status
            $passingScore = $student->major?->minimum_passing_grade ?? 0;
            $row['Status'] = $attempt->score >= $passingScore ? 'PASSED' : 'FAILED';

            $rows[] = $row;
        }

        return collect($rows);
    }

    public function headings(): array
    {
        $questions = $this->exam->questionBank->questions()->orderBy('id')->get();

        $headers = ['Name', 'Email', 'School', 'Class', 'University', 'Major'];

        foreach ($questions as $question) {
            $headers[] = "Q{$question->id}";
        }

        $headers[] = 'Total Score';
        $headers[] = 'Percentage';
        $headers[] = 'Status';

        return $headers;
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling
        $sheet->getStyle('1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => '366092'],
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Auto-fit columns
        foreach ($sheet->getColumnIterator() as $column) {
            $sheet->getColumnDimension($column->getColumnLetter())->setAutoSize(true);
        }

        return [];
    }
}
