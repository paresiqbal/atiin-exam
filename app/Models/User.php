<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'account_type',
        'pro_expires_at',
        'university_id',
        'major_id',
        'school_id',
        'class',
        'university_selections',
        'photo_path',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'pro_expires_at' => 'datetime',
            'university_selections' => 'array',
        ];
    }

    public function university()
    {
        return $this->belongsTo(University::class);
    }

    public function major()
    {
        return $this->belongsTo(Major::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isPro(): bool
    {
        return $this->account_type === 'pro'
            && ($this->pro_expires_at === null || $this->pro_expires_at->isFuture());
    }

    public function checkProExpiration(): void
    {
        if ($this->account_type !== 'pro') return;

        if ($this->pro_expires_at && $this->pro_expires_at->isPast()) {
            $this->forceFill([
                'account_type' => 'regular',
                'pro_expires_at' => null,
            ])->save();
        }
    }

    public function questionBanks()
    {
        return $this->hasMany(QuestionBank::class, 'teacher_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class, 'student_id');
    }
}
