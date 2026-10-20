<?php

namespace App\Enums;

enum ExamType: string
{
    case UTBK = 'utbk';
    case TKA = 'tka';
    case CBT = 'cbt';

    public function usesIrt(): bool
    {
        return $this === self::UTBK || $this === self::TKA;
    }
}
