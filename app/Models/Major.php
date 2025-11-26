<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
