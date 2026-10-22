<?php

namespace App\Services;

use App\Enums\ExamType;
use App\Models\ExamAttempt;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Http;

class ExamResultsPdfService
{
    private const ATTIN_FORMULA = 1525.0;

    public function generate(ExamAttempt $attempt)
    {
        $student = $attempt->student;
        $exam = $attempt->exam;

        $exam->loadMissing([
            'questionBanks' => fn ($q) => $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order'),
            'questionBanks.questions.options',
        ]);

        $sortedBanks = $exam->questionBanks
            ->sortBy(fn ($bank) => $bank->pivot?->sort_order ?? 0)
            ->values();

        $bankCount = $sortedBanks->count();
        $bankDivisor = $bankCount > 0 ? $bankCount : 1;

        // Build response map
        $responsesByQuestion = $attempt->responses()
            ->with('selectedOption')
            ->get()
            ->keyBy('question_id');

        // Per-block question sections
        $questionSections = $sortedBanks->map(function ($bank, $index) use ($responsesByQuestion) {
            $questions = $bank->questions->unique('id')->values();

            $correct = 0;
            $mappedQuestions = $questions->map(function ($question) use ($responsesByQuestion, &$correct) {
                $response = $responsesByQuestion->get($question->id);
                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);

                if ($isCorrect) {
                    $correct++;
                }

                return [
                    'question_text' => $this->inlineHtmlImages($question->question_text),
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'image_data' => $this->toDataUri($question->image_url),
                    'student_answer' => $this->inlineHtmlImages($response?->selectedOption?->option_text),
                    'student_answer_img' => $this->toDataUri($response?->selectedOption?->image_url),
                    'correct_answer' => $this->inlineHtmlImages($correctOption?->option_text),
                    'correct_answer_img' => $this->toDataUri($correctOption?->image_url),
                    'is_correct' => $isCorrect,
                    'points_earned' => $isCorrect ? $question->points : 0,
                    'irt_b' => $question->irt_b,
                ];
            });

            $total = $questions->count();
            $blockScore = $total > 0 ? ($correct / $total) * 1000 : 0;

            return [
                'bank_name' => $bank->name,
                'bank_index' => $index + 1,
                'correct' => $correct,
                'total' => $total,
                'block_score' => round($blockScore, 2),
                'questions' => $mappedQuestions,
            ];
        });

        // IRT scores
        $totalSkor = $questionSections->sum('block_score');
        $skorUtbk = $attempt->scoreOnPassingScale();
        $skorUtbkPct = $attempt->irt_block_score !== null
            ? round((float) $attempt->irt_block_score, 2)
            : null;
        $isPassed = $attempt->isPassed();
        $data = [
            'student_name' => $student->name,
            'student_email' => $student->email,
            'school' => $student->school?->name ?? 'N/A',
            'class' => $student->class ?? 'N/A',

            'exam_name' => $exam->name,
            'exam_date' => $attempt->completed_at?->format('Y-m-d H:i'),
            'score_label' => $exam->type === ExamType::UTBK ? 'Skor UTBK' : 'Skor IRT',
            'percent_score_label' => $exam->type === ExamType::UTBK ? 'Skor UTBK (%)' : 'Skor IRT (%)',

            'theta' => $attempt->irt_theta !== null ? round($attempt->irt_theta, 4) : null,
            'total_skor' => round($totalSkor, 2),
            'skor_utbk' => $skorUtbk,
            'skor_utbk_pct' => $skorUtbkPct,

            'status' => 'HASIL UJIAN',
            'pass_status' => $isPassed === null ? null : ($isPassed ? 'LULUS' : 'TIDAK LULUS'),
            'pass_status_class' => $isPassed === null ? null : ($isPassed ? 'passed' : 'failed'),

            // Legacy aliases so Blade does not break
            'score' => $skorUtbk,
            'total_score' => $skorUtbk !== null ? self::ATTIN_FORMULA : null,
            'percentage' => $skorUtbkPct,

            'question_sections' => $questionSections,
        ];

        return Pdf::loadView('pdfs.exam-results', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 0.5)
            ->setOption('margin-right', 0.5)
            ->setOption('margin-bottom', 0.5)
            ->setOption('margin-left', 0.5);
    }

    private function toDataUri(?string $src): ?string
    {
        if (! $src) {
            return null;
        }

        if (str_starts_with($src, 'data:')) {
            return $src;
        }

        $path = parse_url($src, PHP_URL_PATH) ?: '';

        if (str_starts_with($path, '/storage/')) {
            $storageDirectory = realpath(storage_path('app/public'));
            $localPath = realpath(storage_path('app/public/'.substr($path, strlen('/storage/'))));

            if ($storageDirectory && $localPath && str_starts_with($localPath, $storageDirectory.DIRECTORY_SEPARATOR) && is_file($localPath)) {
                $mimeType = mime_content_type($localPath);
                $contents = file_get_contents($localPath);

                if (is_string($mimeType) && str_starts_with($mimeType, 'image/') && is_string($contents)) {
                    return 'data:'.$mimeType.';base64,'.base64_encode($contents);
                }
            }
        }

        if (! preg_match('#^https?://#i', $src)) {
            return null;
        }

        try {
            $response = Http::timeout(8)->get($src);

            if (! $response->successful()) {
                return null;
            }

            $mimeType = $response->header('Content-Type') ?: 'image/png';

            if (! str_starts_with($mimeType, 'image/')) {
                return null;
            }

            return 'data:'.$mimeType.';base64,'.base64_encode($response->body());
        } catch (\Throwable) {
            return null;
        }
    }

    private function inlineHtmlImages(?string $html): string
    {
        if (! $html || stripos($html, '<img') === false) {
            return $html ?? '';
        }

        return preg_replace_callback('/<img\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*>/i', function ($match) {
            $data = $this->toDataUri($match[1]);

            return $data ? str_replace($match[1], $data, $match[0]) : '';
        }, $html) ?? $html;
    }
}
