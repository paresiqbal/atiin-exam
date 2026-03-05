<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'name',
        'description',
        'school_id',
        'start_at',
        'end_at',
        'is_published',
        'irt_scored_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'irt_scored_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function questionBanks()
    {
        return $this->belongsToMany(QuestionBank::class, 'exam_question_bank')
            ->withPivot(['duration_minutes', 'sort_order'])
            ->withTimestamps()
            ->orderBy('exam_question_bank.sort_order');
    }

    public function getTotalDurationMinutesAttribute(): int
    {
        return (int) $this->questionBanks->sum(fn($qb) => (int) $qb->pivot->duration_minutes);
    }

    public function settings()
    {
        return $this->hasOne(ExamSetting::class);
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function tokens()
    {
        return $this->hasMany(ExamToken::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
