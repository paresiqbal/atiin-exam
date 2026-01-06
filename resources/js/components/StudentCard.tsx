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
        <div className="mx-auto w-full max-w-[980px]">
            <div
                className="relative overflow-hidden rounded-2xl border shadow-md"
                style={{
                    aspectRatio: '16 / 9',
                    backgroundImage: `url(${templateUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* PRO/REGULAR Badge */}
                <div className="absolute top-[6%] right-[3%]">
                    {isPro ? (
                        <Badge>PRO</Badge>
                    ) : (
                        <Badge variant="outline">REGULAR</Badge>
                    )}
                </div>

                {/* Photo - positioned at top right */}
                <div className="absolute top-[15%] right-[6%] aspect-[3/4] w-[11.5%] overflow-hidden rounded-xl bg-white/90 shadow">
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

                {/* Name and info - positioned on the left */}
                <div className="absolute top-[15%] right-[19%] left-[6%]">
                    <div className="inline-block rounded-xl bg-white/18 px-4 py-3 backdrop-blur-[2px]">
                        <div className="text-white drop-shadow">
                            <div className="text-[clamp(22px,3.1vw,46px)] leading-none font-extrabold tracking-wide">
                                {name.toUpperCase()}
                            </div>

                            <div className="mt-2 text-[clamp(12px,1.4vw,18px)] font-semibold opacity-95">
                                {(school ?? 'SEKOLAH').toUpperCase()}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[clamp(11px,1.2vw,16px)] font-semibold opacity-90">
                                <span>
                                    KELAS:{' '}
                                    {(className ?? '-')
                                        .toString()
                                        .toUpperCase()}
                                </span>
                                <span className="opacity-70">•</span>
                                <span>ID: {studentId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
