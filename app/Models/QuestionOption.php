<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuestionOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'option_text',
        'image_url',
        'is_correct',
        'option_order',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}
