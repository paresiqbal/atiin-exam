import axios from 'axios';
import { useState } from 'react';
import type { ToastType } from './useToasts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Params {
    attemptId: number;
    initialAnswers: Record<number, number>;
    onToast?: (message: string, type: ToastType) => void;
}

export function useAnswerSync({ attemptId, initialAnswers, onToast }: Params) {
    const [answers, setAnswers] = useState<Record<number, number>>(
        initialAnswers || {},
    );
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    const selectAnswer = async (questionId: number, optionId: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
        setSaveStatus('saving');

        try {
            await axios.post(`/student/exams/${attemptId}/save-answer`, {
                question_id: questionId,
                selected_option_id: optionId,
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        } catch {
            setSaveStatus('error');
            onToast?.('Gagal menyimpan jawaban', 'error');
        }
    };

    const clearAnswer = (questionId: number) => {
        setAnswers((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
    };

    return { answers, saveStatus, selectAnswer, clearAnswer };
}
