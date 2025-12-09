<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExamController as AdminExamController;
use App\Http\Controllers\Admin\MajorController;
use App\Http\Controllers\Admin\QuestionBankController as AdminQuestionBankController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\Admin\QuestionImportController as AdminQuestionImportController;
use App\Http\Controllers\Admin\SchoolController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\UniversityController;
use App\Http\Controllers\Admin\UniversityImportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// controllers
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserImportController;
use App\Http\Controllers\Student\ExamController;
use App\Http\Controllers\Student\ExamHistoryController;
use App\Http\Controllers\Student\UniversityController as StudentUniversityController;
use App\Http\Controllers\Teacher\QuestionBankController;
use App\Http\Controllers\Teacher\QuestionController;
use App\Http\Controllers\Teacher\QuestionImportController;

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
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // User management routes
        Route::resource('users', UserController::class);
        Route::post('users/import/preview', [UserImportController::class, 'preview'])->name('users.import.preview');
        Route::post('users/import', [UserImportController::class, 'import'])->name('users.import');
        Route::get('users/import/template', [UserImportController::class, 'downloadTemplate'])->name('users.import.template');
        Route::get('users/import/template', [UserImportController::class, 'downloadTemplate'])->name('users.import.template');

        Route::get('users/import/schools', [UserImportController::class, 'downloadSchoolList'])->name('users.import.schools');
        Route::resource('schools', SchoolController::class);

        Route::get('students/cards', [StudentController::class, 'cards'])->name('students.cards');
        Route::get('students/cards/download', [StudentController::class, 'downloadCards'])->name('students.cards.download');
        Route::resource('students', StudentController::class);

        // Exam management routes
        Route::resource('exams', AdminExamController::class);
        Route::post('exams/{exam}/publish', [AdminExamController::class, 'publish'])->name('exams.publish');
        Route::get('exams/{exam}/attempts', [AdminExamController::class, 'attempts'])->name('exams.attempts');
        Route::get('attempts/{attempt}', [AdminExamController::class, 'attemptDetail'])->name('attempts.detail');
        Route::get('exams/{exam}/export-results', [AdminExamController::class, 'exportResults'])->name('exams.exportResults');
        Route::post('/exams/{exam}/regenerate-token', [AdminExamController::class, 'regenerateToken'])->name('admin.exams.regenerate-token');
        Route::get('/attempts/{attempt}/download-pdf', [AdminExamController::class, 'downloadAttemptPdf'])->name('attempts.download-pdf');

        Route::resource('majors', MajorController::class, ['only' => ['store', 'edit', 'update', 'destroy']]);
        Route::post('majors', [MajorController::class, 'store'])->name('majors.store');

        Route::resource('universities', UniversityController::class);
        Route::get('universities/options', [UniversityController::class, 'options'])->name('universities.options');
        Route::post('universities/import/preview', [UniversityImportController::class, 'preview'])->name('universities.import.preview');
        Route::post('universities/import', [UniversityImportController::class, 'import'])->name('universities.import');
        Route::get('universities/import/template', [UniversityImportController::class, 'downloadTemplate'])->name('universities.import.template');

        Route::resource('question-banks', AdminQuestionBankController::class);

        // Question routes - nested under question-banks
        Route::get('question-banks/{questionBank}/questions/create', [AdminQuestionController::class, 'create'])->name('questions.create');
        Route::post('question-banks/{questionBank}/questions', [AdminQuestionController::class, 'store'])->name('questions.store');
        Route::get('questions/{question}/edit', [AdminQuestionController::class, 'edit'])->name('questions.edit');
        Route::put('questions/{question}', [AdminQuestionController::class, 'update'])->name('questions.update');
        Route::delete('questions/{question}', [AdminQuestionController::class, 'destroy'])->name('questions.destroy');

        // Import routes
        Route::post('question-banks/{questionBank}/questions/import/preview', [AdminQuestionImportController::class, 'preview'])->name('questions.import.preview');
        Route::post('question-banks/{questionBank}/questions/import', [AdminQuestionImportController::class, 'import'])->name('questions.import');
        Route::get('questions/import/template', [AdminQuestionImportController::class, 'downloadTemplate'])->name('questions.import.template');
        Route::post('questions/upload-image', [AdminQuestionController::class, 'uploadImage'])->name('questions.uploadImage');
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

    Route::get('question-banks/{questionBank}/questions/create', [QuestionController::class, 'create'])->name('questions.create');
    Route::get('questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');

    // Import routes
    Route::post('question-banks/{questionBank}/questions/import/preview', [QuestionImportController::class, 'preview'])->name('questions.import.preview');
    Route::post('question-banks/{questionBank}/questions/import', [QuestionImportController::class, 'import'])->name('questions.import');
    Route::get('question-banks/{questionBank}/questions/import/template', [QuestionImportController::class, 'downloadTemplate'])->name('questions.import.template');
});


// Route Student
Route::middleware(['auth', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('student/StudentDashboard');
    })->name('dashboard');

    Route::get('/universities', [StudentUniversityController::class, 'index'])->name('universities.index');

    Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
    Route::get('/exams/join', [ExamController::class, 'joinForm'])->name('exams.join');
    Route::post('/exams/start', [ExamController::class, 'startExam'])->name('exams.start');
    Route::get('/exams/{attempt}/take', [ExamController::class, 'take'])->name('exams.take');
    Route::post('/exams/{attempt}/save-answer', [ExamController::class, 'saveAnswer'])->name('exams.saveAnswer');
    Route::post('/exams/{attempt}/submit', [ExamController::class, 'submitExam'])->name('exams.submit');
    Route::get('/exams/{attempt}/results', [ExamController::class, 'results'])->name('exams.results');
    Route::get('/exams/{attempt}/download-pdf', [ExamController::class, 'downloadResults'])->name('exams.downloadPdf');
    Route::get('/exams/history', [ExamHistoryController::class, 'index'])->name('exams.history');
    Route::post('/exams/{attempt}/log-violation', [ExamController::class, 'logViolation'])
        ->name('exams.logViolation');
});


require __DIR__ . '/settings.php';
