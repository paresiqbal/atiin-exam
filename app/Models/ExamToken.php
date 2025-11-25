<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $exam_id
 * @property string $token
 * @property string|null $expires_at
 * @property string|null $used_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Exam $exam
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereExamId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ExamToken whereUsedAt($value)
 * @mixin \Eloquent
 */
class ExamToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'token',
        'expires_at',
        'used_at',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
