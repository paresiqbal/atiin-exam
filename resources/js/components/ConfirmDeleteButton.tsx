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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfirmDeleteButtonProps {
    deleteUrl: string;
    resourceLabel?: string;
    itemName?: string;
    className?: string;
    tooltipLabel?: string;
}

export function ConfirmDeleteButton({
    deleteUrl,
    resourceLabel = 'item',
    itemName,
    className,
    tooltipLabel = 'Hapus',
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
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>{tooltipLabel}</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus {resourceLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Anda akan menghapus{' '}
                        <span className="font-extrabold text-primary">
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
                        className="cursor-pointer"
                    >
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
