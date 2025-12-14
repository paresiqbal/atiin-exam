import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function SubmitConfirmDialog({
    open,
    onOpenChange,
    unansweredCount,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unansweredCount: number;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {unansweredCount > 0
                            ? 'Beberapa pertanyaan belum terjawab'
                            : 'Kirim Ujian?'}
                    </DialogTitle>

                    <DialogDescription>
                        {unansweredCount > 0
                            ? `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Yakin ingin mengirim?`
                            : 'Kamu sudah menjawab semua pertanyaan. Siap untuk mengirim?'}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                    >
                        Batal
                    </Button>

                    <Button
                        className="flex-1 bg-green-600 text-white hover:bg-green-700"
                        onClick={onConfirm}
                    >
                        Ya, Kirim Ujian
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
