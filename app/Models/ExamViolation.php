<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamViolation extends Model
{
    protected $fillable = [
        'attempt_id',
        'violation_type',
        'count',
        'last_occurred_at',
    ];

    protected $casts = [
        'last_occurred_at' => 'datetime',
    ];

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }
}
