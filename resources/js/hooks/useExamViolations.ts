import { useEffect } from 'react';
import type { ToastType } from './useToasts';

interface Params {
    attemptId: number;
    attemptStatus: string;
    onToast?: (message: string, type: ToastType) => void;
    onFrozen?: () => void; // e.g reload
}

export function useExamViolations({
    attemptId,
    attemptStatus,
    onToast,
    onFrozen,
}: Params) {
    useEffect(() => {
        const DEFAULT_MAX_WARNINGS = 3;

        const handleVisibilityChange = async () => {
            if (document.hidden && attemptStatus === 'in_progress') {
                try {
                    const response = await fetch(
                        `/student/exams/${attemptId}/log-violation`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN':
                                    document
                                        .querySelector(
                                            'meta[name="csrf-token"]',
                                        )
                                        ?.getAttribute('content') || '',
                            },
                            body: JSON.stringify({
                                violation_type: 'tab_switch',
                            }),
                        },
                    );

                    const data = await response.json();

                    if (data.is_frozen) {
                        onToast?.(data.message || 'Ujian dibekukan!', 'error');
                        onFrozen?.();
                    } else {
                        const violationCount =
                            data.violation_count ?? data.count ?? 0;
                        const maxWarnings =
                            data.max_violations ?? DEFAULT_MAX_WARNINGS;

                        onToast?.(
                            `⚠️ PERINGATAN ${violationCount}/${maxWarnings}: Jangan keluar dari halaman ujian!`,
                            'warning',
                        );
                    }
                } catch (error) {
                    console.error('Error logging violation:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () =>
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
    }, [attemptId, attemptStatus, onToast, onFrozen]);
}
