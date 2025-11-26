<?php

namespace App\Http\Controllers\Student;

use App\Models\University;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class UniversityController extends Controller
{
    public function index()
    {
        $universities = University::with('majors')
            ->orderBy('name')
            ->get();

        return Inertia::render('student/universities/StudentUnivIndex', [
            'universities' => $universities,
        ]);
    }
}
