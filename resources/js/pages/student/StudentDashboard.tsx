import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    BookOpen,
    ClipboardList,
    CreditCard,
    FileText,
    FileUser,
    IdCard,
    Lock,
} from 'lucide-react';
import { useState } from 'react';

type Student = {
    name?: string | null;
    email?: string | null;
    school?: string | null;
    class?: string | null;
};

type Banner = {
    title: string;
    subtitle?: string;
    image_url?: string;
} | null;

function initials(name?: string | null) {
    const n = (name ?? '').trim();
    if (!n) return 'ST';
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join('');
}

function MenuItem({
    icon: Icon,
    label,
    href,
    bgClass,
    locked = false,
}: {
    icon: LucideIcon;
    label: string;
    href?: string;
    bgClass: string;
    locked?: boolean;
}) {
    const [pressed, setPressed] = useState(false);

    const onPress = () => {
        setPressed(true);
        window.setTimeout(() => setPressed(false), 200);
    };

    const content = (
        <div className="flex flex-col items-center gap-2 md:gap-3">
            <div
                className={[
                    'relative flex items-center justify-center rounded-2xl transition',
                    'h-16 w-16 md:h-20 md:w-20',
                    pressed
                        ? 'ring-2 ring-primary/60 ring-offset-2 brightness-95'
                        : '',
                    locked ? 'opacity-60' : '',
                    bgClass,
                ].join(' ')}
            >
                <Icon className="h-7 w-7 md:h-9 md:w-9" />

                {locked && (
                    <span className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                )}
            </div>

            <div className="text-center text-sm text-muted-foreground md:text-base">
                {label}
            </div>

            {locked && (
                <Badge variant="outline" className="h-5 px-2 text-[10px]">
                    PRO
                </Badge>
            )}
        </div>
    );

    const common =
        'transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 rounded-2xl';

    // If locked, always send to account/upgrade page
    const finalHref = locked ? '/student/account' : href;

    return finalHref ? (
        <a
            href={finalHref}
            className={[common, locked ? 'cursor-pointer' : ''].join(' ')}
            onMouseDown={onPress}
            onTouchStart={onPress}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onPress();
            }}
            aria-label={locked ? `${label} (Pro)` : label}
            title={locked ? 'Fitur khusus akun Pro' : undefined}
        >
            {content}
        </a>
    ) : (
        <button
            type="button"
            className={common}
            onMouseDown={onPress}
            onTouchStart={onPress}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onPress();
            }}
        >
            {content}
        </button>
    );
}

export default function StudentDashboard() {
    const { props } = usePage<{
        student?: Student;
        banner?: Banner;
        auth?: { user?: { is_pro?: boolean; account_type?: string } | null };
    }>();

    const student: Student = props.student ?? {};
    const banner = props.banner ?? null;

    const isPro = !!props.auth?.user?.is_pro;

    return (
        <AppLayout>
            <Head title="Student Dashboard" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:max-w-6xl md:space-y-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold md:text-2xl">
                        Attin Bimbel
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted md:h-12 md:w-12">
                        <Bell className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                </div>

                <Card className="rounded-2xl">
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="flex-1 space-y-0.5 md:space-y-1">
                                <div className="text-xs text-muted-foreground md:text-sm">
                                    Halo,
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-base leading-tight font-semibold md:text-2xl">
                                        {student.name ?? '-'}
                                    </div>

                                    {/* PRO / REGULAR badge */}
                                    {isPro ? (
                                        <Badge className="md:text-sm">
                                            PRO
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="md:text-sm"
                                        >
                                            REGULAR
                                        </Badge>
                                    )}
                                </div>

                                <div className="text-xs text-muted-foreground md:text-sm">
                                    {student.email ?? '-'}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 md:pt-3">
                                    {student.school && (
                                        <Badge
                                            variant="secondary"
                                            className="md:text-sm"
                                        >
                                            {student.school}
                                        </Badge>
                                    )}
                                    {student.class && (
                                        <Badge className="md:text-sm">
                                            {student.class}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Avatar className="h-12 w-12 md:h-16 md:w-16">
                                <AvatarImage
                                    src={undefined}
                                    alt={student.name ?? 'Student'}
                                />
                                <AvatarFallback className="md:text-lg">
                                    {initials(student.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>

                {banner && (
                    <Card className="overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            <div className="flex h-24 items-center justify-between bg-muted px-4 md:h-32 md:px-6">
                                <div>
                                    <div className="font-semibold md:text-xl">
                                        {banner.title}
                                    </div>
                                    {banner.subtitle && (
                                        <div className="text-sm text-muted-foreground md:text-base">
                                            {banner.subtitle}
                                        </div>
                                    )}
                                </div>
                                {banner.image_url && (
                                    <img
                                        src={banner.image_url}
                                        alt="Banner"
                                        className="h-16 w-28 rounded-xl object-cover md:h-20 md:w-40"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-2">
                    <div className="text-xl font-semibold md:text-2xl">
                        Menu
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-2 md:grid-cols-6 md:gap-8 md:pt-4">
                        {/* Exams list: always available */}
                        <MenuItem
                            icon={ClipboardList}
                            label="Jadwal Ujian"
                            href="/student/exams"
                            bgClass="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-200"
                        />

                        {/* Exam history: PRO only (locked for regular) */}
                        <MenuItem
                            icon={FileText}
                            label="Hasil Ujian"
                            href="/student/exams/history"
                            locked={!isPro}
                            bgClass="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                        />

                        {/* Universitas: PRO only (locked for regular) */}
                        <MenuItem
                            icon={BookOpen}
                            label="Universitas"
                            href="/student/universities"
                            locked={!isPro}
                            bgClass="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
                        />

                        {/* News: always available */}
                        <MenuItem
                            icon={BookOpen}
                            label="Berita"
                            href="/student/news"
                            bgClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                        />

                        {/* Konsultan: PRO only (locked for regular) */}
                        <MenuItem
                            icon={FileUser}
                            label="Konsultasi"
                            href="/student/consultant-requests"
                            locked={!isPro}
                            bgClass="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200"
                        />

                        {/* Payment/account: always available */}
                        <MenuItem
                            icon={CreditCard}
                            label="Pembayaran"
                            href="/student/account"
                            bgClass="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200"
                        />

                        {/* Card: keep as is (you can decide pro-only later) */}
                        <MenuItem
                            icon={IdCard}
                            label="Kartu"
                            href="/student/card"
                            bgClass="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"
                        />
                    </div>

                    {!isPro && (
                        <div className="pt-2 text-sm text-muted-foreground">
                            Beberapa fitur ditandai{' '}
                            <span className="font-medium">PRO</span>. Upgrade
                            untuk membuka hasil ujian, universitas, dan
                            konsultasi.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
