<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    use HasFactory;

    private const PASSING_SCORE_FORMULA = 1525.0;

    protected $fillable = [
        'student_id',
        'exam_id',
        'started_at',
        'completed_at',
        'score',
        'total_score',
        'irt_theta',
        'irt_block_score',
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
        'irt_block_score' => 'float',
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

    public function scoreOnPassingScale(): ?float
    {
        if ($this->irt_block_score === null) {
            return null;
        }

        return round((float) $this->irt_block_score * self::PASSING_SCORE_FORMULA / 100, 2);
    }

    public function minimumPassingScore(): ?float
    {
        $this->loadMissing('student.major');

        $student = $this->student;
        $selectedMajorId = $student?->university_selections[0]['majors'][0] ?? null;
        $selectedMajor = $selectedMajorId ? Major::query()->find($selectedMajorId) : null;

        $minimumPassingScore = $selectedMajor?->minimum_passing_grade
            ?? $student?->major?->minimum_passing_grade;

        return $minimumPassingScore !== null ? (float) $minimumPassingScore : null;
    }

    public function isPassed(): ?bool
    {
        $this->loadMissing('exam');

        if (
            $this->status !== 'submitted'
            || ! $this->exam?->type?->usesIrt()
        ) {
            return null;
        }

        $score = $this->scoreOnPassingScale();
        $minimumPassingScore = $this->minimumPassingScore();

        if ($score === null || $minimumPassingScore === null) {
            return null;
        }

        return $score >= $minimumPassingScore;
    }
}
