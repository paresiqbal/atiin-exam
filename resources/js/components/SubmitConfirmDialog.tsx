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

type ConfirmMode = 'next_section' | 'submit_exam';

export function SubmitConfirmDialog({
    open,
    onOpenChange,
    unansweredCount,
    mode,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unansweredCount: number;
    mode: ConfirmMode;
    onConfirm: () => void;
}) {
    const hasUnanswered = unansweredCount > 0;
    const isSubmit = mode === 'submit_exam';

    const title = hasUnanswered
        ? 'Beberapa pertanyaan belum terjawab'
        : isSubmit
          ? 'Kirim Ujian?'
          : 'Lanjut ke sesi berikutnya?';

    const description = hasUnanswered
        ? isSubmit
            ? `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Kamu tetap bisa mengirim ujian, tapi jawaban kosong akan bernilai 0.`
            : `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Jika lanjut sesi, soal yang kosong akan tetap kosong dan sesi ini akan dikunci.`
        : isSubmit
          ? 'Kamu sudah menjawab semua pertanyaan. Siap untuk mengirim?'
          : 'Kamu sudah menjawab semua pertanyaan. Siap lanjut ke sesi berikutnya?';

    const confirmLabel = hasUnanswered
        ? isSubmit
            ? 'Tetap Kirim'
            : 'Tetap Lanjut'
        : isSubmit
          ? 'Kirim Ujian'
          : 'Lanjut Sesi';

    const confirmClass = hasUnanswered
        ? 'bg-yellow-500 hover:bg-yellow-600'
        : isSubmit
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-blue-600 hover:bg-blue-700';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {hasUnanswered && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        {title}
                    </DialogTitle>

                    <DialogDescription>{description}</DialogDescription>
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
                        className={`flex-1 text-white ${confirmClass}`}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
