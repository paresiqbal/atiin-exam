<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
