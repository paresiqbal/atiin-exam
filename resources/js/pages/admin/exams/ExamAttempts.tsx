import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Eye, Search, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ActionIconTooltip from '@/components/ActionIconTooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { getPaginationRange } from '@/lib/pagination';

import { UnfreezeAttemptDialog } from '@/components/UnfreezeAttemptDialog';
import AppLayout from '@/layouts/app-layout';

import type { Paginated } from '@/types/pagination';

interface Attempt {
    id: number;
    score: number;
    total_score: number;
    adjusted_score: number;
    adjusted_total_score: number;
    total_questions: number;
    question_bank_count: number;
    percentage: number;
    is_passed: boolean;
    started_at: string;
    completed_at: string | null;
    status: 'in_progress' | 'submitted' | 'frozen' | string;
    is_frozen?: boolean;
    student: {
        id: number;
        name: string;
        email: string;
        university: { name: string | null };
        major: {
            name: string | null;
            minimum_passing_grade: number | null;
        } | null;
    };
}

interface Analytics {
    total_attempts: number;
    passed: number;
    average_score: number | string | null;
}

type StatusFilter = 'all' | 'passed' | 'failed';
type SortBy = 'name' | 'score' | 'date';
type SortDirection = 'asc' | 'desc';

interface Props {
    exam: { id: number; name: string; irt_processed_at?: string | null };
    attempts: Paginated<Attempt>;
    analytics: Analytics;

    // OPTIONAL tapi recommended: backend kirim query aktif biar state konsisten
    filters?: {
        q?: string;
        status?: StatusFilter;
        sort_by?: SortBy;
        sort_dir?: SortDirection;
        per_page?: number;
    };
}

export default function ExamAttempts({
    exam,
    attempts,
    analytics,
    filters,
}: Props) {
    const baseUrl = `/admin/exams/${exam.id}/attempts`;

    const averageScore = Number(analytics.average_score ?? 0);
    const passRate =
        analytics.total_attempts > 0
            ? (analytics.passed / analytics.total_attempts) * 100
            : 0;

    // state init dari filters (biar reload / pagination tetap konsisten)
    const [searchQuery, setSearchQuery] = useState(filters?.q ?? '');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        filters?.status ?? 'all',
    );
    const [sortBy, setSortBy] = useState<SortBy>(filters?.sort_by ?? 'date');
    const [sortDirection, setSortDirection] = useState<SortDirection>(
        filters?.sort_dir ?? 'desc',
    );

    const [rowsPerPage, setRowsPerPage] = useState<number>(
        filters?.per_page ?? (attempts as Paginated<Attempt>).per_page ?? 10,
    );

    // State for unfreeze dialog
    const [unfreezeDialogOpen, setUnfreezeDialogOpen] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(
        null,
    );

    // helper buat fetch dengan query yang konsisten
    const pushQuery = (
        next: Partial<{
            page: number;
            per_page: number;
            q: string;
            status: StatusFilter;
            sort_by: SortBy;
            sort_dir: SortDirection;
        }>,
    ) => {
        router.get(
            baseUrl,
            {
                page: next.page ?? attempts.current_page ?? 1,
                per_page: next.per_page ?? rowsPerPage,
                q: next.q ?? searchQuery,
                status: next.status ?? statusFilter,
                sort_by: next.sort_by ?? sortBy,
                sort_dir: next.sort_dir ?? sortDirection,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const toggleSortDirection = () => {
        const nextDir: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(nextDir);
        pushQuery({ page: 1, sort_dir: nextDir });
    };

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 10;
        setRowsPerPage(perPage);
        pushQuery({ page: 1, per_page: perPage });
    };

    const handleStatusChange = (val: StatusFilter) => {
        setStatusFilter(val);
        pushQuery({ page: 1, status: val });
    };

    const handleSortByChange = (val: SortBy) => {
        setSortBy(val);
        pushQuery({ page: 1, sort_by: val });
    };

    // (opsional) biar search ga request tiap ketik, pakai Enter saja
    const handleSearchSubmit = () => {
        pushQuery({ page: 1, q: searchQuery });
    };

    // Open dialog with selected attempt
    const handleUnfreezeClick = (attempt: Attempt) => {
        setSelectedAttempt(attempt);
        setUnfreezeDialogOpen(true);
    };

    const handleConfirmUnfreeze = () => {
        if (!selectedAttempt) return;

        router.post(
            `/admin/exams/attempts/${selectedAttempt.id}/unfreeze`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setUnfreezeDialogOpen(false);
                    setSelectedAttempt(null);
                },
            },
        );
    };

    const handleUnfreezeDialogOpenChange = (open: boolean) => {
        setUnfreezeDialogOpen(open);
        if (!open) setSelectedAttempt(null);
    };

    // IMPORTANT: table harus render attempts.data (page current)
    const pageAttempts = useMemo(() => attempts.data ?? [], [attempts.data]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ujian', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
                { title: 'Percobaan', href: '#' },
            ]}
        >
            <Head title={`${exam.name} - Percobaan`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header + Export */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Percobaan - {exam.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau kinerja siswa dan data percobaan secara
                            rinci.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={`/admin/exams/${exam.id}/export-results`}
                            className="inline-flex items-center gap-2"
                        >
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Ekspor Nilai (CSV)
                            </Button>
                        </a>

                        {exam.irt_processed_at ? (
                            <a
                                href={`/admin/exams/${exam.id}/irt-export`}
                                className="inline-flex items-center gap-2"
                            >
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download IRT Results
                                </Button>
                            </a>
                        ) : null}
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Percobaan (Selesai)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {analytics.total_attempts}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Lulus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {analytics.passed}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tingkat Kelulusan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {passRate.toFixed(1)}%
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Skor Rata-rata
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {averageScore.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters / Search / Sort */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Search */}
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Search by student name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearchSubmit();
                                }}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    Tekan Enter
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        {/* Status filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(val) =>
                                handleStatusChange(val as StatusFilter)
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status hasil" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Hasil</SelectItem>
                                <SelectItem value="passed">Lulus</SelectItem>
                                <SelectItem value="failed">Gagal</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={sortBy}
                                onValueChange={(val) =>
                                    handleSortByChange(val as SortBy)
                                }
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">
                                        Waktu Mulai
                                    </SelectItem>
                                    <SelectItem value="name">
                                        Nama Siswa
                                    </SelectItem>
                                    <SelectItem value="score">Skor</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleSortDirection}
                                className="shrink-0"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Attempts Table */}
                {pageAttempts.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Tidak ada percobaan yang ditemukan dengan filter
                            saat ini.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg border shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Nama Siswa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Universitas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Jurusan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Status Ujian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Skor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Waktu Pengambilan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {pageAttempts.map((attempt) => {
                                    const rawScore = Number(
                                        attempt.adjusted_score ??
                                            attempt.score ??
                                            0,
                                    );
                                    const totalScore = Number(
                                        attempt.adjusted_total_score ??
                                            attempt.total_score ??
                                            0,
                                    );
                                    const percent =
                                        totalScore > 0
                                            ? (rawScore / totalScore) * 100
                                            : 0;

                                    const isPassed =
                                        typeof attempt.is_passed === 'boolean'
                                            ? attempt.is_passed
                                            : percent >= 60;

                                    let timeTakenMinutes: number | null = null;
                                    if (
                                        attempt.started_at &&
                                        attempt.completed_at
                                    ) {
                                        const started = new Date(
                                            attempt.started_at,
                                        ).getTime();
                                        const completed = new Date(
                                            attempt.completed_at,
                                        ).getTime();
                                        timeTakenMinutes = Math.max(
                                            0,
                                            Math.round(
                                                (completed - started) / 60000,
                                            ),
                                        );
                                    }

                                    const showScore =
                                        attempt.completed_at &&
                                        totalScore > 0;

                                    let statusBadge = (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {attempt.status}
                                        </Badge>
                                    );

                                    if (
                                        attempt.is_frozen ||
                                        attempt.status === 'frozen'
                                    ) {
                                        statusBadge = (
                                            <Badge
                                                variant="destructive"
                                                className="text-xs"
                                            >
                                                Dibekukan
                                            </Badge>
                                        );
                                    } else if (
                                        attempt.status === 'in_progress'
                                    ) {
                                        statusBadge = (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Sedang dikerjakan
                                            </Badge>
                                        );
                                    } else if (attempt.status === 'submitted') {
                                        statusBadge = (
                                            <Badge
                                                variant="default"
                                                className="text-xs"
                                            >
                                                Selesai
                                            </Badge>
                                        );
                                    }

                                    return (
                                        <tr
                                            key={attempt.id}
                                            className="transition-colors hover:bg-foreground/5"
                                        >
                                            <td className="px-6 py-3 text-sm">
                                                <div className="font-medium">
                                                    {attempt.student.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {attempt.student.email}
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                {attempt.student.university
                                                    ?.name ?? (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                {attempt.student.major?.name ??
                                                    '-'}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                {statusBadge}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                {showScore ? (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                            isPassed
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {`${rawScore}/${totalScore} (${percent.toFixed(2)}%)`}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Belum selesai
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                {timeTakenMinutes !== null ? (
                                                    <span>
                                                        {timeTakenMinutes} min
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <ActionIconTooltip label="Detail">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="icon"
                                                        >
                                                            <Link
                                                                href={`/admin/attempts/${attempt.id}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </ActionIconTooltip>

                                                    {(attempt.is_frozen ||
                                                        attempt.status ===
                                                            'frozen') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleUnfreezeClick(
                                                                    attempt,
                                                                )
                                                            }
                                                            className="inline-flex items-center"
                                                        >
                                                            <Unlock className="mr-1 h-4 w-4" />
                                                            Buka
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer: rows per page + pagination (IndexExam style) */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {pageAttempts.length} dari {attempts.total}{' '}
                        data.
                    </div>

                    <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Baris per halaman:
                            </span>
                            <Select
                                value={String(rowsPerPage)}
                                onValueChange={handleChangeRowsPerPage}
                            >
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {attempts.current_page > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                pushQuery({
                                                    page:
                                                        attempts.current_page -
                                                        1,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <PaginationPrevious />
                                        </button>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    attempts.current_page,
                                    attempts.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <button
                                            type="button"
                                            onClick={() => pushQuery({ page })}
                                            className="cursor-pointer"
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    attempts.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </button>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {attempts.current_page <
                                    attempts.last_page ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                pushQuery({
                                                    page:
                                                        attempts.current_page +
                                                        1,
                                                })
                                            }
                                            className="cursor-pointer"
                                        >
                                            <PaginationNext />
                                        </button>
                                    ) : (
                                        <PaginationNext className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>

                <UnfreezeAttemptDialog
                    open={unfreezeDialogOpen}
                    onOpenChange={handleUnfreezeDialogOpenChange}
                    studentName={selectedAttempt?.student.name}
                    onConfirm={handleConfirmUnfreeze}
                />
            </div>
        </AppLayout>
    );
}
