<?php

namespace App\Services;

use App\Models\School;
use Barryvdh\DomPDF\Facade\Pdf;

class StudentCardsPdfService
{
    public function generate(School $school)
    {
        $students = $school->students()
            ->where('role', 'student')
            ->select('id', 'name', 'email', 'class', 'school_id')
            ->get();

        $data = [
            'school_name' => $school->name,
            'students' => $students,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];

        return Pdf::loadView('pdfs.student-cards', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 0.5)
            ->setOption('margin-right', 0.5)
            ->setOption('margin-bottom', 0.5)
            ->setOption('margin-left', 0.5);
    }
}
