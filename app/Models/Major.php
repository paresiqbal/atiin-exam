<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int|null $minimum_passing_grade
 * @property int $university_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\University $university
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereMinimumPassingGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereUniversityId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Major whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Major extends Model
{
    protected $table = 'majors';

    protected $fillable = [
        'name',
        'description',
        'minimum_passing_grade',
        'university_id',
    ];

    public function university()
    {
        return $this->belongsTo(University::class);
    }
}
