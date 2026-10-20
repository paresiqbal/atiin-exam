<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function passwordRules(bool $isStudent = false): array
    {
        return [
            'required',
            'string',
            $isStudent ? Password::min(6) : Password::defaults(),
            'confirmed',
        ];
    }
}
