export interface ExamQuestionBankLite {
    id: number;
    name: string;
    pivot?: {
        duration_minutes: number;
        sort_order: number;
    };
}

export interface ExamData {
    id: number;
    name: string;
    description: string | null;
    is_published: boolean;
    question_banks: ExamQuestionBankLite[];

    attempts_count: number;
    created_at: string;
}

export interface ExamIndexPaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface ExamIndexProps {
    exams: {
        data: ExamData[];
        links: ExamIndexPaginationLink[];
    };
}

// ---------- STUDENT LIST TYPES (new) ----------
export type ExamStatus = 'available' | 'coming_soon' | 'ended';

export interface StudentExamData {
    id: number;
    name: string;
    start_at: string;
    end_at: string;
    status: ExamStatus;
    question_bank: {
        name?: string;
        questions: Array<{ id: number }>;
    };
    settings: {
        time_limit: number;
    };
}

export interface StudentExamIndexProps {
    exams: {
        data: StudentExamData[];
        links: ExamIndexPaginationLink[];
    };
}
