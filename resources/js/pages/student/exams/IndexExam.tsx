'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

type ExamStatus = 'available' | 'coming_soon' | 'ended';

type ExamItem = {
    id: number;
    name: string;
    title?: string | null;
    start_at: string;
    end_at: string;
    status: ExamStatus;

    settings: {
        time_limit_minutes?: number;
        time_limit?: number;
    };

    // ✅ NEW (multi question banks)
    question_banks_count: number;
    questions_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

type PageProps = {
    exams: Paginator<ExamItem>;
    filters?: { q?: string };
};

const statusConfig: Record<ExamStatus, { label: string; className: string }> = {
    available: {
        label: 'Tersedia',
        className:
            'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200',
    },
    coming_soon: {
        label: 'Segera Hadir',
        className:
            'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
    },
    ended: {
        label: 'Berakhir',
        className:
            'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    },
};

function StatusBadge({ status }: { status: ExamStatus }) {
    const cfg = statusConfig[status];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}

function formatDateTime(date: string) {
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Pagination({
    links,
    onNavigate,
}: {
    links: PaginationLink[];
    onNavigate: (url: string) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {links.map((link, idx) => {
                const label = link.label
                    .replace('&laquo;', '«')
                    .replace('&raquo;', '»');

                return (
                    <Button
                        key={`${label}-${idx}`}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && onNavigate(link.url)}
                    >
                        <span dangerouslySetInnerHTML={{ __html: label }} />
                    </Button>
                );
            })}
        </div>
    );
}

export default function IndexExam() {
    const { props } = usePage<PageProps>();
    const exams = props.exams;
    const initialQ = props.filters?.q ?? '';

    const [q, setQ] = useState(initialQ);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            router.get(
                '/student/exams',
                { q: q.trim() || undefined },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 350);

        return () => clearTimeout(t);
    }, [q]);

    const subtitle = useMemo(() => {
        if (!q.trim())
            return 'Pilih ujian untuk melihat jadwal dan mulai mengerjakan.';
        return `Menampilkan hasil untuk: “${q.trim()}”`;
    }, [q]);

    const getTimeLimit = (exam: ExamItem) =>
        exam.settings.time_limit_minutes ?? exam.settings.time_limit ?? 0;

    const handlePageNavigate = (url: string) => {
        router.visit(url, { preserveScroll: true, preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Ujian', href: '/student/exams' }]}>
            <Head title="Ujian" />

            <div className="p-4">
                <div className="mx-auto max-w-3xl space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground">
                            Ujian yang tersedia
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari ujian..."
                            className="h-11 rounded-2xl pl-10"
                        />
                    </div>

                    {/* Empty state */}
                    {exams.data.length === 0 ? (
                        <Card className="rounded-2xl">
                            <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                Tidak ada ujian yang tersedia untuk kelas Anda
                                saat ini.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {exams.data.map((exam) => (
                                <Card
                                    key={exam.id}
                                    className="rounded-2xl transition-shadow hover:shadow-lg"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <CardTitle className="text-base">
                                                    {exam.title ?? exam.name}
                                                </CardTitle>

                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    <span>
                                                        Bank:{' '}
                                                        {
                                                            exam.question_banks_count
                                                        }
                                                    </span>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span>
                                                        Soal:{' '}
                                                        {exam.questions_count}
                                                    </span>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span>
                                                        Waktu:{' '}
                                                        {getTimeLimit(exam)}{' '}
                                                        menit
                                                    </span>
                                                </div>
                                            </div>

                                            <StatusBadge status={exam.status} />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pt-0">
                                        <div className="text-sm text-muted-foreground">
                                            <div>
                                                Mulai:{' '}
                                                {formatDateTime(exam.start_at)}
                                            </div>
                                            <div>
                                                Berakhir:{' '}
                                                {formatDateTime(exam.end_at)}
                                            </div>
                                        </div>

                                        {exam.status === 'available' && (
                                            <Link
                                                href={`/student/exams/join?exam_id=${exam.id}`}
                                            >
                                                <Button className="w-full">
                                                    Mulai Ujian
                                                </Button>
                                            </Link>
                                        )}

                                        {exam.status === 'coming_soon' && (
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                disabled
                                            >
                                                Akan Datang
                                            </Button>
                                        )}

                                        {exam.status === 'ended' && (
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                disabled
                                            >
                                                Ujian Telah Berakhir
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Pagination */}
                            {exams.links?.length > 0 && (
                                <Pagination
                                    links={exams.links}
                                    onNavigate={handlePageNavigate}
                                />
                            )}

                            {/* Meta */}
                            <div className="text-center text-xs text-muted-foreground">
                                Halaman {exams.current_page} dari{' '}
                                {exams.last_page} • Total {exams.total}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
