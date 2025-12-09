<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'started_at',
        'completed_at',
        'score',
        'total_score',
        'status',
        'is_frozen',
        'frozen_at',
        'frozen_reason',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
        'is_frozen' => 'boolean',
        'frozen_at' => 'datetime',
    ];


    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function responses()
    {
        return $this->hasMany(ExamResponse::class);
    }

    public function violations()
    {
        return $this->hasMany(ExamViolation::class, 'attempt_id');
    }
}
