<?php

namespace App\Services;

use App\Models\ExamAttempt;

class IRTService extends IrtScoringService
{
    public function estimateTheta(ExamAttempt $attempt): ?float
    {
        $this->process($attempt);

        return null;
    }

    public function convertToScaledScore(float $theta): float
    {
        return 0.0;
    }
}
