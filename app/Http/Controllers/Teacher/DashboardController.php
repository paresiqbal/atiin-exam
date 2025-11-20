<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('teacher/TeacherDashboard');
    }
}
