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
import { useState } from 'react';

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
    const [finalConfirm, setFinalConfirm] = useState(false);

    const hasUnanswered = unansweredCount > 0;
    const isSubmit = mode === 'submit_exam';

    // reset when dialog closes
    const handleOpenChange = (v: boolean) => {
        if (!v) setFinalConfirm(false);
        onOpenChange(v);
    };

    /* =========================
       STEP 2 – FINAL CONFIRM
    ========================= */
    if (open && isSubmit && finalConfirm) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Konfirmasi Terakhir
                        </DialogTitle>

                        <DialogDescription className="space-y-2">
                            <p>
                                Setelah ujian dikirim, kamu <b>tidak bisa</b>{' '}
                                kembali atau mengubah jawaban.
                            </p>
                            <p className="font-semibold">
                                Apakah kamu benar-benar yakin?
                            </p>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setFinalConfirm(false)}
                        >
                            Kembali
                        </Button>

                        <Button
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                            onClick={onConfirm}
                        >
                            Ya, Kirim Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    /* =========================
       STEP 1 – NORMAL CONFIRM
    ========================= */

    const title = hasUnanswered
        ? 'Beberapa pertanyaan belum terjawab'
        : isSubmit
          ? 'Kirim Ujian?'
          : 'Lanjut ke sesi berikutnya?';

    const description = hasUnanswered
        ? isSubmit
            ? `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Jawaban kosong akan bernilai 0.`
            : `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Sesi ini akan dikunci.`
        : isSubmit
          ? 'Kamu sudah menjawab semua pertanyaan.'
          : 'Siap lanjut ke sesi berikutnya?';

    const confirmLabel = isSubmit
        ? hasUnanswered
            ? 'Tetap Kirim'
            : 'Kirim Ujian'
        : hasUnanswered
          ? 'Tetap Lanjut'
          : 'Lanjut Sesi';

    const confirmClass = isSubmit
        ? hasUnanswered
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : 'bg-green-600 hover:bg-green-700'
        : 'bg-blue-600 hover:bg-blue-700';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        className="flex-1"
                        onClick={() => handleOpenChange(false)}
                    >
                        Batal
                    </Button>

                    <Button
                        className={`flex-1 text-white ${confirmClass}`}
                        onClick={() => {
                            if (isSubmit) {
                                setFinalConfirm(true); // ⬅️ second step
                            } else {
                                onConfirm();
                            }
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
