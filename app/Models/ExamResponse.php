<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $exam_attempt_id
 * @property int $question_id
 * @property int|null $selected_option_id
 * @property int $points_earned
 * @property string|null $answered_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\ExamAttempt $attempt
 * @property-read \App\Models\Question $question
 * @property-read \App\Models\QuestionOption|null $selectedOption
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereAnsweredAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereExamAttemptId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse wherePointsEarned($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereQuestionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereSelectedOptionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamResponse whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class ExamResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_attempt_id',
        'question_id',
        'selected_option_id',
        'points_earned',
        'answered_at',
    ];

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function selectedOption()
    {
        return $this->belongsTo(QuestionOption::class, 'selected_option_id');
    }
}
