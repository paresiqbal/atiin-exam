import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmBulkDeleteButtonProps {
    count: number;
    onConfirm: () => Promise<void> | void;
    disabled?: boolean;
    resourceLabelPlural?: string;
    className?: string;
}

export function ConfirmBulkDeleteButton({
    count,
    onConfirm,
    disabled,
    resourceLabelPlural = 'item',
    className,
}: ConfirmBulkDeleteButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirmClick = async () => {
        try {
            setLoading(true);
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = disabled || count === 0 || loading;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="destructive"
                    disabled={isDisabled}
                    className={className}
                >
                    <Trash2 className="mr-1 h-4 w-4" />({count})
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Hapus {count} {resourceLabelPlural}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda akan menghapus{' '}
                        <span className="font-semibold text-green-500">
                            {count} {resourceLabelPlural} terpilih
                        </span>
                        . Tindakan ini tidak dapat dibatalkan dan dapat
                        mempengaruhi data terkait.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Batal
                    </AlertDialogCancel>

                    <AlertDialogAction asChild>
                        <Button
                            onClick={handleConfirmClick}
                            disabled={loading}
                            variant="destructive"
                        >
                            {loading ? 'Menghapus...' : 'Ya, hapus semua'}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
