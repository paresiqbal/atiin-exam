import { Head, router, usePage, useRemember } from '@inertiajs/react';
import {
    Download,
    Search,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { limitPaginationLinks } from '@/lib/pagination';

interface ExamAttempt {
    id: number;
    exam: {
        id: number;
        title?: string | null; // allow missing
        name?: string | null; // allow missing
        type: 'utbk' | 'tka' | 'cbt';
        irt_processed_at?: string | null;
    };
    score: number | null;
    raw_score: number | null;
    total_score: number | null;
    irt_theta?: number | null;
    irt_block_score?: number | null;
    percentage: number | null;
    completed_at: string;
}

type PaginationLink = { url: string | null; label: string; active: boolean };

interface ExamHistoryProps {
    attempts: {
        data: ExamAttempt[];
        current_page: number;
        total: number;
        last_page: number;
        links?: PaginationLink[];
    };
    filters?: {
        q?: string;
        sort?: 'date' | 'score';
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
    { title: 'History Ujian', href: '/student/exams/history' },
];

function formatDateCompact(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
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
                        className="h-9 rounded-full"
                    >
                        <span dangerouslySetInnerHTML={{ __html: label }} />
                    </Button>
                );
            })}
        </div>
    );
}

export default function HistoryExam() {
    // ✅ Fix TS constraint issue: cast props from usePage() instead of generic PageProps constraint
    const { attempts, filters } = usePage()
        .props as unknown as ExamHistoryProps;

    const [searchInput, setSearchInput] = useRemember(
        filters?.q ?? '',
        'Student/Exams/History/search',
    );
    const [sortBy, setSortBy] = useRemember<'date' | 'score'>(
        filters?.sort ?? 'date',
        'Student/Exams/History/sort',
    );

    const [downloadingIds, setDownloadingIds] = useState<Set<number>>(
        new Set(),
    );

    // Server-side query (fast + consistent)
    useEffect(() => {
        if (
            searchInput.trim() === (filters?.q ?? '') &&
            sortBy === (filters?.sort ?? 'date')
        ) {
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                '/student/exams/history',
                {
                    q: searchInput.trim() || undefined,
                    sort: sortBy,
                    page: 1,
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchInput, sortBy, filters?.q, filters?.sort]);

    // Precompute for UI sorting fallback (still useful if server returns same page)
    const processed = useMemo(() => {
        const mapped = attempts.data.map((a) => {
            const examName = (a.exam?.title ?? a.exam?.name ?? '').toString();
            return {
                ...a,
                examName,
                examNameLc: examName.toLowerCase(),
                completedTs: new Date(a.completed_at).getTime() || 0,
            };
        });

        const filtered = mapped;

        if (sortBy === 'date')
            filtered.sort((a, b) => b.completedTs - a.completedTs);
        else
            filtered.sort(
                (a, b) => (b.percentage ?? -1) - (a.percentage ?? -1),
            );

        return filtered;
    }, [attempts.data, sortBy]);

    const resultsReadyCount = useMemo(
        () => attempts.data.filter((a) => a.percentage !== null).length,
        [attempts.data],
    );
    const waitingCount = useMemo(
        () => attempts.data.filter((a) => a.percentage === null).length,
        [attempts.data],
    );

    const avgPercentage = useMemo(() => {
        const scored = attempts.data.filter(
            (a) => typeof a.percentage === 'number',
        );
        if (scored.length === 0) return '0.0';
        const sum = scored.reduce((acc, a) => acc + (a.percentage ?? 0), 0);
        return (sum / scored.length).toFixed(1);
    }, [attempts.data]);

    const handleDownloadPDF = async (attemptId: number) => {
        setDownloadingIds((prev) => new Set(prev).add(attemptId));
        try {
            const response = await fetch(
                `/student/exams/${attemptId}/download-pdf`,
            );
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `exam-results-${attemptId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDownloadingIds((prev) => {
                const s = new Set(prev);
                s.delete(attemptId);
                return s;
            });
        }
    };

    const handleNavigate = (url: string) => {
        router.visit(url, { preserveScroll: true, preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History Ujian" />

            <div className="p-4">
                <div className="mx-auto max-w-3xl space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground">
                            History Ujian
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tinjau percobaan ujian dan unduh hasilnya.
                        </p>
                    </div>

                    {/* Summary (smaller) */}
                    <div className="grid grid-cols-3 gap-2">
                        <Card className="rounded-2xl">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                                    Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl font-bold">
                                    {attempts.total}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                                    Hasil tersedia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {resultsReadyCount}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {waitingCount > 0
                                        ? `${waitingCount} menunggu`
                                        : ''}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                                    Rata-rata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl font-bold text-primary">
                                    {avgPercentage}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari ujian..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-10 rounded-2xl pr-9 pl-9"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Sort controls */}
                    <div className="flex flex-wrap gap-2">
                        <div className="ml-auto flex gap-2">
                            <Button
                                variant={
                                    sortBy === 'date' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => setSortBy('date')}
                                className="h-9 rounded-full"
                            >
                                Terbaru
                            </Button>
                            <Button
                                variant={
                                    sortBy === 'score' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => setSortBy('score')}
                                className="h-9 rounded-full"
                            >
                                Skor
                            </Button>
                        </div>
                    </div>

                    {/* List (smaller cards) */}
                    <div className="space-y-2">
                        {processed.length > 0 ? (
                            processed.map((attempt) => {
                                const examName = attempt.examName || '-';
                                const isWaiting = attempt.percentage === null;

                                return (
                                    <Card
                                        key={attempt.id}
                                        className="rounded-2xl"
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {/* ✅ exam name */}
                                                    <div className="truncate text-sm font-semibold">
                                                        {examName}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatDateCompact(
                                                            attempt.completed_at,
                                                        )}
                                                    </div>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        isWaiting
                                                            ? 'shrink-0'
                                                            : 'shrink-0 border-primary/30 text-primary'
                                                    }
                                                >
                                                    {isWaiting ? 'Menunggu' : 'Hasil tersedia'}
                                                </Badge>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                                                <div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {attempt.exam.type === 'cbt' ? 'Persentase Nilai' : 'Skor IRT'}
                                                    </div>
                                                    <div className="text-sm font-bold">
                                                        {isWaiting
                                                            ? 'Menunggu'
                                                            : `${attempt.percentage?.toFixed(
                                                                  2,
                                                              )}%`}
                                                    </div>
                                                </div>
                                                {attempt.exam.type === 'cbt' && (
                                                    <div className="text-right">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Poin
                                                        </div>
                                                        <div className="text-sm font-bold text-primary">
                                                            {attempt.raw_score ?? 0} / {attempt.total_score ?? 0}
                                                        </div>
                                                    </div>
                                                )}
                                                {attempt.exam.type !== 'cbt' && (
                                                    <div className="text-right">
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Theta
                                                        </div>
                                                        <div className="text-sm font-bold text-primary">
                                                            {isWaiting ||
                                                            attempt.irt_theta === null ||
                                                            attempt.irt_theta === undefined
                                                                ? 'Menunggu'
                                                                : attempt.irt_theta.toFixed(3)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {attempt.exam.type !== 'cbt' && <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDownloadPDF(
                                                        attempt.id,
                                                    )
                                                }
                                                disabled={
                                                    downloadingIds.has(
                                                        attempt.id,
                                                    ) ||
                                                    !attempt.exam.irt_processed_at
                                                }
                                                className="mt-3 h-9 w-full gap-2 rounded-xl"
                                            >
                                                <Download className="h-4 w-4" />
                                                {downloadingIds.has(attempt.id)
                                                    ? 'Mengunduh...'
                                                    : attempt.exam
                                                          .irt_processed_at
                                                      ? 'Unduh PDF'
                                                      : 'Menunggu Proses IRT'}
                                            </Button>}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="rounded-2xl py-12 text-center">
                                <CardContent>
                                    {attempts.data.length === 0 ? (
                                        <>
                                            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                                            <h3 className="mt-3 font-semibold text-foreground">
                                                Belum ada history ujian
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Selesaikan ujian pertama Anda
                                                untuk melihat history
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                                            <h3 className="mt-3 font-semibold text-foreground">
                                                Tidak ada percobaan ditemukan
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Coba sesuaikan filter atau
                                                pencarian Anda
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagination */}
                        {attempts.links && attempts.links.length > 0 && (
                            <Pagination
                                links={limitPaginationLinks(
                                    attempts.links,
                                    attempts.current_page,
                                    attempts.last_page,
                                )}
                                onNavigate={handleNavigate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
