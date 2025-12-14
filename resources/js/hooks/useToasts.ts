import { useRef, useState } from 'react';

export type ToastType = 'warning' | 'error' | 'success';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);

    const showToast = (message: string, type: ToastType = 'warning') => {
        const id = toastIdRef.current++;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, showToast, removeToast };
}
