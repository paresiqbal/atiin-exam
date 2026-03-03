<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_bank_id',
        'question_text',
        'question_type',
        'points',
        'irt_a',
        'irt_b',
        'image_url',
    ];

    protected static function booted()
    {
        static::creating(function (Question $question) {
            if ($question->irt_a === null) {
                $question->irt_a = 1.0000;
            }

            if ($question->irt_b === null) {
                $question->irt_b = 0.0000;
            }
        });
    }

    public function questionBank()
    {
        return $this->belongsTo(QuestionBank::class);
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class);
    }
}
