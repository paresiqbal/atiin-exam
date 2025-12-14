import { useEffect, useMemo, useRef, useState } from 'react';
import type { ToastType } from './useToasts';

interface Params {
    timeLimit: number; // minutes
    elapsedMinutes: number;
    onExpired: () => void;
    onWarn?: (message: string, type: ToastType) => void;
}

export function useExamTimer({
    timeLimit,
    elapsedMinutes,
    onExpired,
    onWarn,
}: Params) {
    const [timeLeft, setTimeLeft] = useState(
        Math.max(0, timeLimit * 60 - Math.floor(elapsedMinutes) * 60),
    );

    const expiredRef = useRef(false);

    useEffect(() => {
        if (timeLeft <= 0 && !expiredRef.current) {
            expiredRef.current = true;
            onExpired();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpired]);

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
