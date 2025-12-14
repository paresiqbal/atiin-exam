import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

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
    const hasUnanswered = unansweredCount > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {hasUnanswered && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}

                        {hasUnanswered
                            ? 'Beberapa pertanyaan belum terjawab'
                            : 'Kirim Ujian?'}
                    </DialogTitle>

                    <DialogDescription>
                        {hasUnanswered
                            ? `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Kamu tetap bisa mengirim ujian, tapi jawaban kosong akan bernilai 0.`
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
                        onClick={onConfirm}
                        className={`flex-1 text-white ${
                            hasUnanswered
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {hasUnanswered ? 'Tetap Kirim' : 'Kirim Ujian'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
