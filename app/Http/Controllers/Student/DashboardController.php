<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user()->load(['university', 'major', 'school']);

        return Inertia::render('student/StudentDashboard', [
            'student' => [
                'name' => $user->name,
                'email' => $user->email,
                'school' => $user->school?->name,
                'class' => $user->class,
            ],
            'banner' => null,
        ]);
    }
}
