<?php

namespace Database\Seeders;

use App\Models\QuestionBank;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuestionBankSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::where('role', 'teacher')->first() ?? User::first();

        if (! $teacher) {
            $this->command->warn('No users found. Please seed users (teachers) first.');
            return;
        }

        $questionTypes = [
            'multiple_choice',
            'multiple_select',
            'true_false',
        ];

        $banks = [
            [
                'name'        => 'Matematika - Ujian Akhir Semester',
                'description' => 'Bank soal matematika untuk ujian akhir semester tingkat SMP.',
            ],
            [
                'name'        => 'Bahasa Inggris - Ujian Nasional',
                'description' => 'Bank soal Bahasa Inggris untuk persiapan ujian nasional.',
            ],
            [
                'name'        => 'IPA - Ujian Akhir Semester',
                'description' => 'Bank soal Ilmu Pengetahuan Alam untuk ujian akhir semester.',
            ],
        ];

        foreach ($banks as $bankIndex => $bankData) {
            $questionBank = QuestionBank::create([
                'teacher_id'  => $teacher->id,
                'name'        => $bankData['name'],
                'description' => $bankData['description'],
            ]);

            for ($i = 1; $i <= 10; $i++) {
                // Rotate through the 3 valid types
                $type = $questionTypes[($i - 1) % count($questionTypes)];

                $question = Question::create([
                    'question_bank_id' => $questionBank->id,
                    'question_text'    => "[{$bankData['name']}] Soal ke-$i (tipe: $type).",
                    'question_type'    => $type,
                    'points'           => rand(1, 5),
                    'image_url'        => "https://picsum.photos/seed/bank{$bankIndex}_q{$i}/800/600",
                ]);

                $this->createOptionsForQuestion($question, $type, $i);
            }
        }
    }

    protected function createOptionsForQuestion(Question $question, string $type, int $index): void
    {
        switch ($type) {
            case 'multiple_choice':
                // exactly ONE correct answer
                $this->createMultipleChoiceOptions($question, $index, false);
                break;

            case 'multiple_select':
                // more than one correct answer
                $this->createMultipleChoiceOptions($question, $index, true);
                break;

            case 'true_false':
                $this->createTrueFalseOptions($question);
                break;
        }
    }

    protected function createMultipleChoiceOptions(Question $question, int $index, bool $multipleSelect = false): void
    {
        $labels = ['A', 'B', 'C', 'D'];

        if ($multipleSelect) {

            $numCorrect = rand(2, 3);
            $correctKeys = array_rand($labels, $numCorrect);
            if (! is_array($correctKeys)) {
                $correctKeys = [$correctKeys];
            }
        } else {
            $correctKey = array_rand($labels);
            $correctKeys = [$correctKey];
        }

        foreach ($labels as $i => $label) {
            QuestionOption::create([
                'question_id'  => $question->id,
                'option_text'  => "Pilihan $label untuk soal ke-{$index}",
                'is_correct'   => in_array($i, $correctKeys, true),
                'option_order' => $i,
            ]);
        }
    }

    protected function createTrueFalseOptions(Question $question): void
    {
        $correctIsTrue = (bool) rand(0, 1);

        QuestionOption::create([
            'question_id'  => $question->id,
            'option_text'  => 'True',
            'is_correct'   => $correctIsTrue,
            'option_order' => 0,
        ]);

        QuestionOption::create([
            'question_id'  => $question->id,
            'option_text'  => 'False',
            'is_correct'   => ! $correctIsTrue,
            'option_order' => 1,
        ]);
    }
}
