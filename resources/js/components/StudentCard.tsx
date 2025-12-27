import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type StudentCardProps = {
    name: string;
    studentId: string;
    school?: string | null;
    className?: string | null;
    isPro: boolean;
};

export default function StudentCard({
    name,
    studentId,
    school,
    className,
    isPro,
}: StudentCardProps) {
    return (
        <Card className="mx-auto max-w-md overflow-hidden border-2">
            {/* Header */}
            <div className="border-b bg-muted px-4 py-3">
                <div className="text-xs tracking-wide text-muted-foreground">
                    KARTU SISWA
                </div>
                <div className="text-lg font-semibold">ATTIN BIMBEL</div>
            </div>

            <CardContent className="space-y-4 p-4">
                {/* Main Info */}
                <div className="space-y-2">
                    <Field label="Nama">
                        <span className="font-semibold">{name}</span>
                    </Field>

                    <Field label="Nomor Siswa">{studentId}</Field>

                    <Field label="Sekolah">{school ?? '-'}</Field>

                    <Field label="Kelas">{className ?? '-'}</Field>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                        Status Akun
                    </div>

                    {isPro ? (
                        <Badge>PRO</Badge>
                    ) : (
                        <Badge variant="outline">REGULAR</Badge>
                    )}
                </div>
            </CardContent>

            {/* Footer */}
            <div className="border-t bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
                Berlaku selama terdaftar sebagai siswa aktif
            </div>
        </Card>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-muted-foreground">{label}</div>
            <div className="col-span-2">{children}</div>
        </div>
    );
}
