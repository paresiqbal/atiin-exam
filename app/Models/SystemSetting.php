<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'exam_auto_freeze',
    ];

    protected $casts = [
        'exam_auto_freeze' => 'boolean',
    ];
}
