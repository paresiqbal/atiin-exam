<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// controllers
use App\Http\Controllers\Admin\UserController;

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
Route::middleware(['auth', 'role:teacher'])->group(function () {
    Route::get('/teacher/bank', function () {
        return inertia('Teacher/QuestionBank');
    });
});


// Route Student
Route::middleware(['auth', 'role:student'])->group(function () {
    Route::get('/exam/start', function () {
        return inertia('Student/StartExam');
    });
});


require __DIR__ . '/settings.php';
