import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Clock, Hourglass, Play, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { limitPaginationLinks } from '@/lib/pagination';

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

function formatDateTime(value?: string | null) {
    if (!value) return '-';

    // Convert "YYYY-MM-DD HH:mm:ss.000000" -> "YYYY-MM-DDTHH:mm:ss"
    const normalized = value.replace(' ', 'T').replace(/\.\d+$/, '');
    const d = new Date(normalized);

    if (Number.isNaN(d.getTime())) {
        return value.replace(/\.\d+$/, '');
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

function getTimeLimit(exam: ExamItem) {
    const v =
        exam.settings.time_limit_minutes ?? exam.settings.time_limit ?? null;
    if (!v || v <= 0) return null;
    return v;
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
                            {exams.data.map((exam) => {
                                const limit = getTimeLimit(exam);

                                return (
                                    <Card
                                        key={exam.id}
                                        className="rounded-2xl border transition hover:shadow-lg"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <CardTitle className="truncate text-base md:text-lg">
                                                        {exam.title ??
                                                            exam.name}
                                                    </CardTitle>
                                                    <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                                                        {exam.questions_count}{' '}
                                                        soal
                                                        {exam.question_banks_count
                                                            ? ` • ${exam.question_banks_count} bank soal`
                                                            : ''}
                                                    </div>
                                                </div>

                                                <StatusBadge
                                                    status={exam.status}
                                                />
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4 pt-0">
                                            {/* Meta info */}
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                <div className="rounded-xl bg-muted/50 p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        Durasi
                                                    </div>
                                                    <div className="mt-1 text-sm font-semibold">
                                                        {limit
                                                            ? `${limit} menit`
                                                            : '-'}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl bg-muted/50 p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        Mulai
                                                    </div>
                                                    <div className="mt-1 text-sm font-semibold">
                                                        {formatDateTime(
                                                            exam.start_at,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl bg-muted/50 p-3">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Hourglass className="h-4 w-4" />
                                                        Berakhir
                                                    </div>
                                                    <div className="mt-1 text-sm font-semibold">
                                                        {formatDateTime(
                                                            exam.end_at,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            {exam.status === 'available' && (
                                                <Link
                                                    href={`/student/exams/join?exam_id=${exam.id}`}
                                                >
                                                    <Button className="w-full gap-2">
                                                        <Play className="h-4 w-4" />
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
                                );
                            })}

                            {/* Pagination */}
                            {exams.links?.length > 0 && (
                                <Pagination
                                    links={limitPaginationLinks(
                                        exams.links,
                                        exams.current_page,
                                        exams.last_page,
                                    )}
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
