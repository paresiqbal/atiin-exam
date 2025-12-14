import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Toast } from '../hooks/useToasts';

export function ToastStack({
    toasts,
    onRemove,
}: {
    toasts: Toast[];
    onRemove: (id: number) => void;
}) {
    return (
        <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'animate-in rounded-lg border-2 p-4 shadow-lg slide-in-from-right',
                        toast.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
                            : toast.type === 'warning'
                              ? 'border-orange-200 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200'
                              : 'border-green-200 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200',
                    )}
                >
                    <div className="flex items-start gap-3">
                        <span className="flex-1 text-sm font-medium">
                            {toast.message}
                        </span>
                        <button
                            onClick={() => onRemove(toast.id)}
                            className="text-current opacity-70 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
