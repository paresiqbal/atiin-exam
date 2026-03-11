<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'exam_auto_freeze',
        'exam_allow_multiple_attempts',
    ];

    protected $casts = [
        'exam_auto_freeze' => 'boolean',
        'exam_allow_multiple_attempts' => 'boolean',
    ];
}
