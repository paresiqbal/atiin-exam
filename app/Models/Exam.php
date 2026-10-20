<?php

namespace App\Models;

use App\Enums\ExamType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'name',
        'type',
        'description',
        'school_id',
        'start_at',
        'end_at',
        'is_published',
        'irt_scored_at',
        'irt_processed_at',
    ];

    protected $casts = [
        'type' => ExamType::class,
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'irt_scored_at' => 'datetime',
        'irt_processed_at' => 'datetime',
    ];

    public function scopeOfType(Builder $query, ExamType $type): Builder
    {
        return $query->where('type', $type->value);
    }

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
        return (int) $this->questionBanks->sum(fn ($qb) => (int) $qb->pivot->duration_minutes);
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
