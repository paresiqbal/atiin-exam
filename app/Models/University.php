<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $website
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Major> $majors
 * @property-read int|null $majors_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|University whereWebsite($value)
 * @mixin \Eloquent
 */
class University extends Model
{
    protected $table = 'universities';

    protected $fillable = [
        'name',
        'description',
        'website',
    ];

    public function majors()
    {
        return $this->hasMany(Major::class);
    }
}
