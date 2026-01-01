import { Badge } from '@/components/ui/badge';

type StudentCardProps = {
    templateUrl: string;
    photoUrl?: string | null;

    name: string;
    studentId: string;
    school?: string | null;
    className?: string | null;
    isPro: boolean;
};

export default function StudentCard({
    templateUrl,
    photoUrl,
    name,
    studentId,
    school,
    className,
    isPro,
}: StudentCardProps) {
    return (
        <div className="mx-auto w-full max-w-[720px]">
            <div
                className="relative overflow-hidden rounded-2xl border shadow-md"
                style={{
                    aspectRatio: '16 / 9',
                    backgroundImage: `url(${templateUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* PRO badge */}
                <div className="absolute top-[6%] right-[4%]">
                    {isPro ? (
                        <Badge>PRO</Badge>
                    ) : (
                        <Badge variant="outline">REGULAR</Badge>
                    )}
                </div>

                {/* Photo */}
                <div className="absolute top-[26%] left-[6%] aspect-[3/4] w-[18%] overflow-hidden rounded-xl bg-white/90">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt="Student photo"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            NO PHOTO
                        </div>
                    )}
                </div>

                {/* Text block */}
                <div className="absolute top-[26%] right-[6%] left-[28%] text-white">
                    <div className="text-xs tracking-[0.3em] opacity-80">
                        KARTU SISWA
                    </div>

                    <div className="mt-1 text-lg font-semibold">
                        ATTIN BIMBEL
                    </div>

                    <div className="mt-4 font-mono text-sm tracking-[0.18em] opacity-90">
                        {studentId}
                    </div>

                    <div className="mt-1 text-base font-semibold tracking-wide">
                        {name.toUpperCase()}
                    </div>

                    <div className="mt-2 text-xs opacity-85">
                        {school ?? '-'} • {className ?? '-'}
                    </div>

                    <div className="mt-4 text-[10px] opacity-75">
                        Berlaku selama terdaftar sebagai siswa aktif
                    </div>
                </div>

                {/* Optional dark overlay if template too bright */}
                <div className="pointer-events-none absolute inset-0 bg-black/10" />
            </div>
        </div>
    );
}
