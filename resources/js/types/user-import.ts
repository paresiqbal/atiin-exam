export interface School {
    id: number;
    name: string;
}

export interface PreviewRow {
    row: number;
    name: string;
    email: string;
    school_id: number | string | null;
    class: string | null;
    password: string | null;
}

export interface ImportPreviewResponse {
    success: boolean;
    preview: PreviewRow[];
    errors: string[];
    total_rows: number;
    message?: string;
}

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserCreateFormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    school_id: string;
    class: string;
}
