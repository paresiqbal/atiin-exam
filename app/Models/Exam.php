<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'question_bank_id',
        'name',
        'description',
        'school_id',

        'start_at',
        'end_at',
        'is_published',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function questionBank()
    {
        return $this->belongsTo(QuestionBank::class);
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
}
