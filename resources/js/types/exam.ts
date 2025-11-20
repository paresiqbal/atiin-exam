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
