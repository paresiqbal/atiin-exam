<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// controllers
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Student\ExamController;
use App\Http\Controllers\Teacher\QuestionBankController;
use App\Http\Controllers\Teacher\QuestionController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


// Route Admin
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('admin/AdminDashboard');
    })->name('dashboard');

    Route::resource('users', UserController::class);
});

// Route Teacher
Route::middleware(['auth', 'role:teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('teacher/TeacherDashboard');
    })->name('dashboard');

    Route::resource('question-banks', QuestionBankController::class);
    Route::post('question-banks/{questionBank}/questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::put('questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
    Route::delete('questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
});


// Route Student
Route::middleware(['auth', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('teacher/TeacherDashboard');
    })->name('dashboard');

    Route::get('/exams/join', [ExamController::class, 'joinForm'])->name('exams.join');
    Route::post('/exams/start', [ExamController::class, 'startExam'])->name('exams.start');
});


require __DIR__ . '/settings.php';
