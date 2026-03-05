<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'exam_id',
        'started_at',
        'completed_at',
        'score',
        'total_score',
        'irt_theta',
        'status',
        'is_frozen',
        'frozen_at',
        'frozen_reason',
        'current_section',
        'section_started_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'section_started_at' => 'datetime',
        'is_frozen' => 'boolean',
        'current_section' => 'integer',
        'irt_theta' => 'float',
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
