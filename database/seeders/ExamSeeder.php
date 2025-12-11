<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamSetting;
use App\Models\ExamToken;
use App\Models\User;
use App\Models\School;
use App\Models\QuestionBank;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get required Parent Data (we need at least one of each to link the exam)
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $school = School::first() ?? School::factory()->create();
        $questionBank = QuestionBank::first() ?? QuestionBank::factory()->create();

        // 2. Define some realistic exam templates
        $examTypes = ['UTS', 'UAS', 'Quiz Harian', 'Try Out'];
        $subjects = ['Matematika', 'Bahasa Indonesia', 'Fisika', 'Biologi', 'Kimia', 'Sejarah', 'Ekonomi', 'Sosiologi'];

        for ($i = 0; $i < 10; $i++) {

            // Randomly pick a subject and type (e.g., "UAS Fisika")
            $subject = $subjects[array_rand($subjects)];
            $type = $examTypes[array_rand($examTypes)];

            // Set Start time (sometime in the next 2 weeks)
            $startAt = Carbon::now()->addDays(rand(1, 14))->setHour(rand(7, 10))->setMinute(0);

            // Set End time (2-3 hours after start)
            $endAt = (clone $startAt)->addHours(rand(2, 3));

            // A. Create the Exam
            $exam = Exam::create([
                'admin_id'         => $admin->id,
                'school_id'        => $school->id,
                'question_bank_id' => $questionBank->id, // Ideally randomize this if you have many banks
                'name'             => "{$type} {$subject} Kelas " . rand(10, 12),
                'description'      => "Ujian {$subject} untuk evaluasi semester ini.",
                'start_at'         => $startAt,
                'end_at'           => $endAt,
                'is_published'     => rand(0, 1) == 1, // Randomly publish some
            ]);

            // B. Create Exam Settings (1-to-1)
            ExamSetting::create([
                'exam_id'            => $exam->id,
                'time_limit_minutes' => rand(60, 120), // 60 to 120 minutes
                'shuffle_questions'  => true,
                'allow_review'       => true,
                'max_attempts'       => 1,
            ]);

            // C. Create Exam Token (1-to-many, but usually 1 active)
            ExamToken::create([
                'exam_id' => $exam->id,
                'token'   => $this->generateToken(),
            ]);
        }
    }

    /**
     * Helper to generate a unique uppercase token exactly like your controller.
     */
    private function generateToken(): string
    {
        return strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 6));
    }
}
