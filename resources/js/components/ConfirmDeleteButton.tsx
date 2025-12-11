import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteButtonProps {
    deleteUrl: string;
    resourceLabel?: string;
    itemName?: string;
    className?: string;
}

export function ConfirmDeleteButton({
    deleteUrl,
    resourceLabel = 'item',
    itemName,
    className,
}: ConfirmDeleteButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = () => {
        setLoading(true);

        router.delete(deleteUrl, {
            onFinish: () => setLoading(false),
        });
    };

    const displayName = itemName ?? resourceLabel;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={className ?? 'text-red-600'}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus {resourceLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda akan menghapus{' '}
                        <span className="font-semibold text-green-500">
                            {displayName}
                        </span>
                        . Tindakan ini tidak dapat dibatalkan dan dapat
                        mempengaruhi data terkait.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Batal
                    </AlertDialogCancel>
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        variant="destructive"
                    >
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
