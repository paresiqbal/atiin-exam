<?php

namespace App\Services;

use App\Models\ExamAttempt;

class IrtScoringService
{
    public function process(ExamAttempt $attempt): void
    {
        $responsesCount = $attempt->responses()->count();

        if ($responsesCount === 0) {
            $attempt->irt_theta = null;
            $attempt->irt_score = 0;
            $attempt->irt_processed_at = now();
            $attempt->save();
            return;
        }

        $totalScore = (float) ($attempt->total_score ?? 0);
        $score = (float) ($attempt->score ?? 0);

        $percentage = $totalScore > 0 ? ($score / $totalScore) * 100 : 0;

        $attempt->irt_theta = null;
        $attempt->irt_score = round($percentage, 2);
        $attempt->irt_processed_at = now();
        $attempt->save();
    }
}
