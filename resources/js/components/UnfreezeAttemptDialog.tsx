import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnfreezeAttemptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentName?: string;
    onConfirm: () => void;
}

export function UnfreezeAttemptDialog({
    open,
    onOpenChange,
    studentName,
    onConfirm,
}: UnfreezeAttemptDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Lepaskan Pembekuan Percobaan?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {studentName
                            ? `Anda akan membuka kembali akses ujian untuk siswa "${studentName}". Siswa dapat melanjutkan ujian dari kondisi terakhir.`
                            : 'Anda akan membuka kembali akses ujian untuk siswa ini. Siswa dapat melanjutkan ujian dari kondisi terakhir.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={onConfirm}
                    >
                        Ya, Lepaskan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
