export type QuestionType = 'multiple_choice' | 'multiple_select' | 'true_false';

export interface Option {
    id?: number;
    option_text: string;
    is_correct: boolean;
}

export interface Question {
    id: number;
    question_text: string;
    question_type: QuestionType;
    points: number;
    image_url: string | null;
    options: Option[];
}

export interface QuestionBank {
    id: number;
    name: string;
    description: string | null;
    questions: Question[];
}

export interface QuestionOption {
    id?: number;
    option_text: string;
    is_correct: boolean;
}
