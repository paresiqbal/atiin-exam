<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use Illuminate\Support\Collection;

class IrtRaschService
{
    public function scoreExam(
        Exam $exam,
        float $threshold = 0.001,
        int $maxIterations = 100,
        ?Collection $attemptsOverride = null
    ): array
    {
        $exam->loadMissing([
            'questionBanks' => function ($q) {
                $q->withPivot(['sort_order'])->orderBy('exam_question_bank.sort_order');
            },
            'questionBanks.questions.options',
        ]);

        $questions = $exam->questionBanks
            ->flatMap(fn($bank) => $bank->questions->sortBy('id'))
            ->unique('id')
            ->values();

        $attempts = $attemptsOverride
            ? $attemptsOverride->loadMissing(['responses.selectedOption'])
            : $exam->attempts()
                ->where('status', 'submitted')
                ->with(['responses.selectedOption'])
                ->get();

        if ($questions->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No questions found for this exam.',
            ];
        }

        if ($attempts->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No submitted attempts found for this exam.',
            ];
        }

        $questionIds = $questions->pluck('id')->values();
        $itemCount = $questionIds->count();
        $personCount = $attempts->count();

        $matrix = $this->buildResponseMatrix($attempts, $questionIds);
        $thetas = array_fill(0, $personCount, 0.0);
        $bs = array_fill(0, $itemCount, 0.0);

        $converged = false;
        $iteration = 0;

        for ($iteration = 0; $iteration < $maxIterations; $iteration++) {
            $maxChange = 0.0;

            // Update abilities (theta)
            foreach ($attempts as $i => $attempt) {
                $score = array_sum($matrix[$i]);
                if ($score <= 0) {
                    $newTheta = -4.0;
                } elseif ($score >= $itemCount) {
                    $newTheta = 4.0;
                } else {
                    $sumNum = 0.0;
                    $sumDen = 0.0;
                    for ($j = 0; $j < $itemCount; $j++) {
                        $p = $this->probCorrect($thetas[$i], $bs[$j]);
                        $sumNum += ($matrix[$i][$j] - $p);
                        $sumDen += ($p * (1 - $p));
                    }
                    $newTheta = $sumDen > 0
                        ? $thetas[$i] + ($sumNum / $sumDen)
                        : $thetas[$i];
                    $newTheta = $this->clamp($newTheta, -4.0, 4.0);
                }

                $maxChange = max($maxChange, abs($newTheta - $thetas[$i]));
                $thetas[$i] = $newTheta;
            }

            // Update difficulties (b)
            for ($j = 0; $j < $itemCount; $j++) {
                $itemScore = 0.0;
                for ($i = 0; $i < $personCount; $i++) {
                    $itemScore += $matrix[$i][$j];
                }

                if ($itemScore <= 0) {
                    $newB = 4.0;
                } elseif ($itemScore >= $personCount) {
                    $newB = -4.0;
                } else {
                    $sumNum = 0.0;
                    $sumDen = 0.0;
                    for ($i = 0; $i < $personCount; $i++) {
                        $p = $this->probCorrect($thetas[$i], $bs[$j]);
                        $sumNum += ($p - $matrix[$i][$j]);
                        $sumDen += ($p * (1 - $p));
                    }
                    $newB = $sumDen > 0
                        ? $bs[$j] + ($sumNum / $sumDen)
                        : $bs[$j];
                    $newB = $this->clamp($newB, -4.0, 4.0);
                }

                $maxChange = max($maxChange, abs($newB - $bs[$j]));
                $bs[$j] = $newB;
            }

            // Normalize: mean(b) = 0, adjust theta accordingly
            $meanB = array_sum($bs) / max(1, $itemCount);
            if ($meanB != 0.0) {
                for ($j = 0; $j < $itemCount; $j++) {
                    $bs[$j] -= $meanB;
                }
                for ($i = 0; $i < $personCount; $i++) {
                    $thetas[$i] = $this->clamp($thetas[$i] - $meanB, -4.0, 4.0);
                }
            }

            if ($maxChange < $threshold) {
                $converged = true;
                break;
            }
        }

        $this->persistResults($questions, $bs, $attempts, $thetas, $exam);

        return [
            'success' => true,
            'converged' => $converged,
            'iterations' => $iteration + 1,
        ];
    }

    private function buildResponseMatrix(Collection $attempts, Collection $questionIds): array
    {
        $matrix = [];

        foreach ($attempts as $attempt) {
            $byQuestion = $attempt->responses->keyBy('question_id');
            $row = [];

            foreach ($questionIds as $questionId) {
                $response = $byQuestion->get($questionId);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);
                $row[] = $isCorrect ? 1.0 : 0.0;
            }

            $matrix[] = $row;
        }

        return $matrix;
    }

    private function persistResults(
        Collection $questions,
        array $bs,
        Collection $attempts,
        array $thetas,
        Exam $exam
    ): void {
        foreach ($questions as $index => $question) {
            $question->update(['irt_b' => $bs[$index]]);
        }

        foreach ($attempts as $index => $attempt) {
            $attempt->update(['irt_theta' => $thetas[$index]]);
        }

        $exam->update(['irt_scored_at' => now()]);
    }

    private function probCorrect(float $theta, float $b): float
    {
        $z = $theta - $b;
        return 1.0 / (1.0 + exp(-$z));
    }

    private function clamp(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
