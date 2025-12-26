import { useEffect, useMemo, useRef, useState } from 'react';
import type { ToastType } from './useToasts';

interface Params {
    timeLimit: number; // minutes
    sectionStartedAt: string; // ISO
    serverNow: string; // ISO (from backend)
    onExpired: () => void;
    onWarn?: (message: string, type: ToastType) => void;
}

export function useExamTimer({
    timeLimit,
    sectionStartedAt,
    serverNow,
    onExpired,
    onWarn,
}: Params) {
    const offsetRef = useRef(0);
    const expiredRef = useRef(false);

    useEffect(() => {
        offsetRef.current = Date.parse(serverNow) - Date.now();
        expiredRef.current = false;
    }, [serverNow, sectionStartedAt, timeLimit]);

    const computeLeft = () => {
        const startMs = Date.parse(sectionStartedAt);
        const nowServerMs = Date.now() + offsetRef.current;
        const elapsedSec = Math.floor((nowServerMs - startMs) / 1000);
        return Math.max(0, timeLimit * 60 - elapsedSec);
    };

    const [timeLeft, setTimeLeft] = useState(() => computeLeft());

    useEffect(() => {
        setTimeLeft(computeLeft());
        const t = setInterval(() => {
            const left = computeLeft();
            setTimeLeft(left);

            if (left <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpired();
            }
        }, 1000);

        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLimit, sectionStartedAt, onExpired]);

    useEffect(() => {
        if (!onWarn) return;
        if (timeLeft === 600) onWarn('⏰ Waktu tersisa 10 menit!', 'warning');
        if (timeLeft === 300) onWarn('⚠️ Waktu tersisa 5 menit!', 'error');
        if (timeLeft === 60) onWarn('🚨 Waktu tersisa 1 menit!', 'error');
    }, [timeLeft, onWarn]);

    const formatted = useMemo(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    return { timeLeft, formatted };
}
