<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExamController as AdminExamController;
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


// Route Admin
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        Route::resource('users', UserController::class);

        Route::resource('exams', AdminExamController::class);
        Route::post('exams/{exam}/publish', [AdminExamController::class, 'publish'])->name('exams.publish');
        Route::get('exams/{exam}/attempts', [AdminExamController::class, 'attempts'])->name('exams.attempts');
        Route::get('attempts/{attempt}', [AdminExamController::class, 'attemptDetail'])->name('attempts.detail');
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
    Route::post('questions/images', [QuestionController::class, 'uploadImage'])->name('questions.images.upload');
});


// Route Student
Route::middleware(['auth', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('student/StudentDashboard');
    })->name('dashboard');

    Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
    Route::get('/exams/join', [ExamController::class, 'joinForm'])->name('exams.join');
    Route::post('/exams/start', [ExamController::class, 'startExam'])->name('exams.start');
    Route::get('/exams/{attempt}/take', [ExamController::class, 'take'])->name('exams.take');
    Route::post('/exams/{attempt}/save-answer', [ExamController::class, 'saveAnswer'])->name('exams.saveAnswer');
    Route::post('/exams/{attempt}/submit', [ExamController::class, 'submitExam'])->name('exams.submit');
    Route::get('/exams/{attempt}/results', [ExamController::class, 'results'])->name('exams.results');
});


require __DIR__ . '/settings.php';
