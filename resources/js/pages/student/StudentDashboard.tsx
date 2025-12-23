import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    BookOpen,
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileText,
    IdCard,
} from 'lucide-react';

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
    const content = (
        <div className="flex flex-col items-center gap-2">
            <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bgClass}`}
            >
                <Icon className="h-7 w-7" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
                {label}
            </div>
        </div>
    );

    return href ? (
        <a href={href} className="transition hover:opacity-90">
            {content}
        </a>
    ) : (
        <button type="button" className="transition hover:opacity-90">
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

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold">Attin One</div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Bell className="h-5 w-5" />
                    </button>
                </div>

                <Card className="rounded-2xl">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-0.5">
                                <div className="text-xs text-muted-foreground">
                                    Halo,
                                </div>
                                <div className="text-base leading-tight font-semibold">
                                    {student.name ?? '-'}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    {student.email ?? '-'}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {student.school && (
                                        <Badge variant="secondary">
                                            {student.school}
                                        </Badge>
                                    )}
                                    {student.class && (
                                        <Badge>{student.class}</Badge>
                                    )}
                                </div>
                            </div>

                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={undefined}
                                    alt={student.name ?? 'Student'}
                                />
                                <AvatarFallback>
                                    {initials(student.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>

                {banner && (
                    <Card className="overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            <div className="flex h-24 items-center justify-between bg-muted px-4">
                                <div>
                                    <div className="font-semibold">
                                        {banner.title}
                                    </div>
                                    {banner.subtitle && (
                                        <div className="text-sm text-muted-foreground">
                                            {banner.subtitle}
                                        </div>
                                    )}
                                </div>
                                {banner.image_url && (
                                    <img
                                        src={banner.image_url}
                                        alt="Banner"
                                        className="h-16 w-28 rounded-xl object-cover"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-2">
                    <div className="text-xl font-semibold">Menu</div>

                    <div className="grid grid-cols-3 gap-6 pt-2">
                        <MenuItem
                            icon={CalendarDays}
                            label="Jadwal TO"
                            href="#"
                            bgClass="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200"
                        />
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
                            href="#"
                            bgClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
