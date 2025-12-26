import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    attempt: {
        id: number;
        frozen_at: string;
        frozen_reason: string;
        violations: Array<{
            violation_type: string;
            count: number;
        }>;
    };
    frozen_reason: string;
}

const VIOLATION_LABELS: Record<string, string> = {
    tab_switch: 'Berpindah tab / aplikasi',
    copy_attempt: 'Mencoba menyalin teks',
    paste_attempt: 'Mencoba menempelkan teks',
};

export default function FrozenExam({ attempt, frozen_reason }: Props) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Ujian Dibekukan" />

            <Card className="w-full max-w-md border-destructive/50">
                <CardContent className="space-y-6 p-8 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Ujian Dibekukan</h1>
                        <p className="text-muted-foreground">
                            Ujian Anda dihentikan sementara karena terdeteksi
                            pelanggaran aturan.
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4 text-left">
                        <div className="mb-2 text-sm font-medium">
                            Alasan Pembekuan
                        </div>

                        <div className="text-sm leading-relaxed text-muted-foreground">
                            {frozen_reason}
                        </div>

                        {attempt.violations &&
                            attempt.violations.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="text-sm font-medium">
                                        Detail Pelanggaran
                                    </div>

                                    {attempt.violations.map((v, i) => (
                                        <div
                                            key={i}
                                            className="text-sm text-muted-foreground"
                                        >
                                            •{' '}
                                            {VIOLATION_LABELS[
                                                v.violation_type
                                            ] ?? 'Pelanggaran'}{' '}
                                            — {v.count} kali
                                        </div>
                                    ))}
                                </div>
                            )}
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Jika Anda merasa ini adalah kesalahan, silakan
                            hubungi admin atau pengawas ujian.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
