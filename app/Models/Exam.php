<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $admin_id
 * @property int $question_bank_id
 * @property int|null $school_id
 * @property string|null $class
 * @property string $name
 * @property string|null $description
 * @property int $is_published
 * @property string|null $start_at
 * @property string|null $end_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $admin
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ExamAttempt> $attempts
 * @property-read int|null $attempts_count
 * @property-read \App\Models\QuestionBank $questionBank
 * @property-read \App\Models\ExamSetting|null $settings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ExamToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereAdminId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereClass($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereEndAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereQuestionBankId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereSchoolId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereStartAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Exam whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'question_bank_id',
        'name',
        'description',
        'school_id',
        'class',
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
