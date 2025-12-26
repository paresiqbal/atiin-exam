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
    IdCard,
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
}: {
    icon: LucideIcon;
    label: string;
    href?: string;
    bgClass: string;
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
                    // size bigger on desktop
                    'flex items-center justify-center rounded-2xl transition',
                    'h-16 w-16 md:h-20 md:w-20',
                    // color feedback (pressed)
                    pressed
                        ? 'ring-2 ring-primary/60 ring-offset-2 brightness-95'
                        : '',
                    // base color
                    bgClass,
                ].join(' ')}
            >
                <Icon className="h-7 w-7 md:h-9 md:w-9" />
            </div>

            <div className="text-center text-sm text-muted-foreground md:text-base">
                {label}
            </div>
        </div>
    );

    const common =
        'transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 rounded-2xl';

    return href ? (
        <a
            href={href}
            className={common}
            onMouseDown={onPress}
            onTouchStart={onPress}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onPress();
            }}
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
    const { props } = usePage<{ student?: Student; banner?: Banner }>();
    const student: Student = props.student ?? {};
    const banner = props.banner ?? null;

    return (
        <AppLayout>
            <Head title="Student Dashboard" />

            {/* wider on desktop */}
            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:max-w-6xl md:space-y-6 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold md:text-2xl">
                        Attin Bimbel
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted md:h-12 md:w-12">
                        <Bell className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                </div>

                {/* bigger card on desktop */}
                <Card className="rounded-2xl">
                    <CardContent className="p-3 md:p-6">
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="flex-1 space-y-0.5 md:space-y-1">
                                <div className="text-xs text-muted-foreground md:text-sm">
                                    Halo,
                                </div>
                                <div className="text-base leading-tight font-semibold md:text-2xl">
                                    {student.name ?? '-'}
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

                    {/* mobile stays 3 cols; desktop becomes 1 row (6 cols) */}
                    <div className="grid grid-cols-3 gap-6 pt-2 md:grid-cols-6 md:gap-8 md:pt-4">
                        <MenuItem
                            icon={ClipboardList}
                            label="Jadwal Ujian"
                            href="/student/exams"
                            bgClass="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-200"
                        />
                        <MenuItem
                            icon={FileText}
                            label="Hasil Ujian"
                            href="/student/exams/history"
                            bgClass="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                        />
                        <MenuItem
                            icon={BookOpen}
                            label="Universitas"
                            href="/student/universities"
                            bgClass="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
                        />
                        <MenuItem
                            icon={CreditCard}
                            label="Pembayaran"
                            href="#"
                            bgClass="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200"
                        />
                        <MenuItem
                            icon={IdCard}
                            label="Kartu"
                            href="#"
                            bgClass="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"
                        />
                        <MenuItem
                            icon={BookOpen}
                            label="Berita"
                            href="/student/news"
                            bgClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
