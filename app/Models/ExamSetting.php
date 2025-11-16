<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExamSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'time_limit_minutes',
        'shuffle_questions',
        'allow_review',
        'max_attempts',
    ];

    public $timestamps = true;
}
