<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExamToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'token',
        'expires_at',
        'used_at',
    ];
}
