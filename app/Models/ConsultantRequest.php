<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultantRequest extends Model
{
    protected $fillable = [
        'student_id',
        'consultant_id',
        'topic',
        'message',
        'preferred_date',
        'status',
        'admin_note',
        'printed_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'printed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consultant_id');
    }
}
