// ---------- TEACHER LIST TYPES (existing) ----------
export interface ExamData {
    id: number;
    name: string;
    description: string;
    is_published: boolean;
    question_bank: {
        name: string;
    } | null;
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
    // description?: string; // add if you send it
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
