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
        'image_url',
        'irt_b',
    ];

    protected $casts = [
        'irt_b' => 'float',
    ];

    public function questionBank()
    {
        return $this->belongsTo(QuestionBank::class);
    }

    public function options()
    {
        return $this->hasMany(QuestionOption::class);
    }
}
