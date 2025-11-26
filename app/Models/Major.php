<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Major extends Model
{
    protected $table = 'majors';

    protected $fillable = [
        'university_id',
        'name',
        'description',
        'minimum_passing_grade',
    ];

    public function university()
    {
        return $this->belongsTo(University::class);
    }
}
