<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $teacher_id
 * @property string $name
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Question> $questions
 * @property-read int|null $questions_count
 * @property-read \App\Models\User $teacher
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|QuestionBank whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class QuestionBank extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'name',
        'description',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
