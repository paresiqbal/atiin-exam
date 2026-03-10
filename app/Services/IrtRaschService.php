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
    ): array {
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

        // FIX 1: Always call ->values() to guarantee 0-indexed sequential keys.
        // Without this, Laravel collection keys from filtered/overridden sets may
        // be non-sequential, causing $matrix[$i] to access the wrong row.
        $attempts = $attemptsOverride
            ? $attemptsOverride->loadMissing(['responses.selectedOption'])->values()
            : $exam->attempts()
            ->where('status', 'submitted')
            ->with(['responses.selectedOption'])
            ->get()
            ->values();

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
        $itemCount   = $questionIds->count();
        $personCount = $attempts->count();

        $matrix = $this->buildResponseMatrix($attempts, $questionIds);
        $thetas = array_fill(0, $personCount, 0.0);
        $bs     = array_fill(0, $itemCount, 0.0);

        $converged = false;
        $iteration = 0;

        for ($iteration = 0; $iteration < $maxIterations; $iteration++) {

            // Snapshot before this iteration so we can measure true change
            // AFTER normalization (on the stable, anchored scale).
            // FIX 2: Previously maxChange was computed before b-centering,
            // meaning convergence was measured on a drifting scale and the
            // algorithm could falsely converge or never converge.
            $prevThetas = $thetas;
            $prevBs     = $bs;

            // ── Update person abilities (theta) ────────────────────────────
            for ($i = 0; $i < $personCount; $i++) {
                $score = array_sum($matrix[$i]);

                if ($score <= 0) {
                    $thetas[$i] = -4.0;
                } elseif ($score >= $itemCount) {
                    $thetas[$i] = 4.0;
                } else {
                    $sumNum = 0.0;
                    $sumDen = 0.0;
                    for ($j = 0; $j < $itemCount; $j++) {
                        $p       = $this->probCorrect($thetas[$i], $bs[$j]);
                        $sumNum += ($matrix[$i][$j] - $p);
                        $sumDen += ($p * (1.0 - $p));
                    }
                    $newTheta   = $sumDen > 0
                        ? $thetas[$i] + ($sumNum / $sumDen)
                        : $thetas[$i];
                    $thetas[$i] = $this->clamp($newTheta, -4.0, 4.0);
                }
            }

            // ── Update item difficulties (b) ────────────────────────────────
            for ($j = 0; $j < $itemCount; $j++) {
                $itemScore = 0.0;
                for ($i = 0; $i < $personCount; $i++) {
                    $itemScore += $matrix[$i][$j];
                }

                if ($itemScore <= 0) {
                    $bs[$j] = 4.0;
                } elseif ($itemScore >= $personCount) {
                    $bs[$j] = -4.0;
                } else {
                    $sumNum = 0.0;
                    $sumDen = 0.0;
                    for ($i = 0; $i < $personCount; $i++) {
                        $p       = $this->probCorrect($thetas[$i], $bs[$j]);
                        $sumNum += ($p - $matrix[$i][$j]);
                        $sumDen += ($p * (1.0 - $p));
                    }
                    $newB   = $sumDen > 0
                        ? $bs[$j] + ($sumNum / $sumDen)
                        : $bs[$j];
                    $bs[$j] = $this->clamp($newB, -4.0, 4.0);
                }
            }

            // ── Normalize: anchor mean(b) = 0, shift theta by same amount ──
            // This must happen BEFORE convergence check so that maxChange is
            // measured on the final, anchored values — not a drifting scale.
            $meanB = array_sum($bs) / max(1, $itemCount);
            if ($meanB !== 0.0) {
                for ($j = 0; $j < $itemCount; $j++) {
                    $bs[$j] -= $meanB;
                }
                for ($i = 0; $i < $personCount; $i++) {
                    $thetas[$i] = $this->clamp($thetas[$i] - $meanB, -4.0, 4.0);
                }
            }

            // ── Check convergence on the normalized values ──────────────────
            $maxChange = 0.0;
            for ($i = 0; $i < $personCount; $i++) {
                $maxChange = max($maxChange, abs($thetas[$i] - $prevThetas[$i]));
            }
            for ($j = 0; $j < $itemCount; $j++) {
                $maxChange = max($maxChange, abs($bs[$j] - $prevBs[$j]));
            }

            if ($maxChange < $threshold) {
                $converged = true;
                break;
            }
        }

        $this->persistResults($questions, $bs, $attempts, $thetas, $exam, $matrix);

        return [
            'success'    => true,
            'converged'  => $converged,
            'iterations' => $iteration + 1,
        ];
    }

    private function buildResponseMatrix(Collection $attempts, Collection $questionIds): array
    {
        $matrix = [];

        // $attempts is already ->values() (0-indexed) when passed from scoreExam.
        foreach ($attempts as $attempt) {
            $byQuestion = $attempt->responses->keyBy('question_id');
            $row        = [];

            foreach ($questionIds as $questionId) {
                $response = $byQuestion->get($questionId);
                $isCorrect = (bool) ($response?->selectedOption?->is_correct ?? false);
                $row[]     = $isCorrect ? 1.0 : 0.0;
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
        Exam $exam,
        array $matrix          // already-computed 0-indexed response matrix
    ): void {
        // Save item difficulties
        foreach ($questions as $index => $question) {
            $question->update(['irt_b' => $bs[$index]]);
        }

        // Build bank→[question_indices] map using $questions (already in memory,
        // no additional DB queries needed — avoids lazy-loading issues).
        // $questions is ordered by bank sort_order then question id, matching
        // how buildResponseMatrix populated the matrix columns.
        $banks = $exam->questionBanks
            ->sortBy(fn($b) => $b->pivot?->sort_order ?? 0)
            ->values();
        $bankCount = max(1, $banks->count());

        // Map question_id → matrix column index (matches $questionIds order)
        $questionIndexMap = $questions->mapWithKeys(
            fn($q, $idx) => [$q->id => $idx]
        )->all();

        // Map bank index → [matrix column indices] and total question count
        $bankColIndices = array_fill(0, $bankCount, []);
        foreach ($banks as $bi => $bank) {
            // Reload bank questions fresh to guarantee they are available
            foreach ($bank->questions()->pluck('id') as $qid) {
                if (isset($questionIndexMap[$qid])) {
                    $bankColIndices[$bi][] = $questionIndexMap[$qid];
                }
            }
        }

        // Calculate and save skor_utbk_pct for each attempt using $matrix
        foreach ($attempts as $i => $attempt) {
            $totalSkor = 0.0;

            foreach ($bankColIndices as $bi => $colIndices) {
                $total   = count($colIndices);
                $correct = 0;
                foreach ($colIndices as $col) {
                    $correct += (int) ($matrix[$i][$col] ?? 0);
                }
                $totalSkor += $total > 0 ? ($correct / $total) * 1000 : 0;
            }

            $skorUtbk    = $totalSkor / $bankCount;
            $skorUtbkPct = round(($skorUtbk / 1525.0) * 100, 4);

            $attempt->update([
                'irt_theta'       => $thetas[$i],
                'irt_block_score' => $skorUtbkPct,
            ]);
        }

        $exam->update(['irt_scored_at' => now()]);
    }

    private function probCorrect(float $theta, float $b): float
    {
        // Rasch model: P(correct | θ, b) = 1 / (1 + exp(-(θ - b)))
        return 1.0 / (1.0 + exp(- ($theta - $b)));
    }

    private function clamp(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
