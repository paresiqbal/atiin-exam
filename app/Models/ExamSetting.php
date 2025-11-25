<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $exam_id
 * @property int $time_limit_minutes
 * @property int $shuffle_questions
 * @property int $allow_review
 * @property int $max_attempts
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereAllowReview($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereExamId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereMaxAttempts($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereShuffleQuestions($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereTimeLimitMinutes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamSetting whereUpdatedAt($value)
 * @mixin \Eloquent
 */
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
