import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Download, Eye, FileText, Loader2, Search, Unlock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ActionIconTooltip from '@/components/ActionIconTooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import type { Paginated } from '@/types/pagination';

interface Attempt {
    id: number;
    skor_utbk_pct: number | null;
    skor_utbk: number | null;   // null = IRT not yet processed
    adjusted_score: number;
    adjusted_total_score: number;
    total_questions: number;
    question_bank_count: number;
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
type FreezeFilter = 'all' | 'frozen' | 'not_frozen';

interface Props {
    exam: { id: number; name: string; irt_processed_at?: string | null };
    attempts: Paginated<Attempt>;
    analytics: Analytics;
    filters?: {
        q?: string;
        status?: StatusFilter;
        freeze?: FreezeFilter;
        sort_by?: SortBy;
        sort_dir?: SortDirection;
        per_page?: number;
    };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a duration in minutes as "Xj Ym" or "Ym" */
function formatDuration(minutes: number): string {
    if (minutes <= 0) return '-';
    // If > 24 hours, the data is almost certainly wrong (timezone mismatch etc.)
    if (minutes > 1440) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}j ${m}m`;
    if (h > 0) return `${h}j`;
    return `${m}m`;
}

/** Parse ISO datetime string safely — returns null on failure */
function parseDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

export default function ExamAttempts({ exam, attempts, analytics, filters }: Props) {
    const baseUrl = `/admin/exams/${exam.id}/attempts`;
    const irtProcessed = !!exam.irt_processed_at;

    const averageScore = Number(analytics.average_score ?? 0);
    const passRate =
        analytics.total_attempts > 0
            ? (analytics.passed / analytics.total_attempts) * 100
            : 0;

    const [searchQuery, setSearchQuery]     = useState(filters?.q ?? '');
    const [statusFilter, setStatusFilter]   = useState<StatusFilter>(filters?.status ?? 'all');
    const [freezeFilter, setFreezeFilter]   = useState<FreezeFilter>(filters?.freeze ?? 'all');
    const [sortBy, setSortBy]               = useState<SortBy>(filters?.sort_by ?? 'date');
    const [sortDirection, setSortDirection] = useState<SortDirection>(filters?.sort_dir ?? 'desc');
    const [rowsPerPage, setRowsPerPage]     = useState<number>(
        filters?.per_page ?? (attempts as Paginated<Attempt>).per_page ?? 10,
    );

    const [unfreezeDialogOpen, setUnfreezeDialogOpen] = useState(false);
    const [selectedAttempt, setSelectedAttempt]       = useState<Attempt | null>(null);
    const [selectedAttemptIds, setSelectedAttemptIds] = useState<number[]>([]);
    const [downloadingLetterId, setDownloadingLetterId] = useState<number | null>(null);

    const handleDownloadLetter = async (attemptId: number) => {
        setDownloadingLetterId(attemptId);
        try {
            const response = await fetch(`/admin/attempts/${attemptId}/download-letter`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) {
                const text = await response.text();
                toast.error(text || 'Gagal mengunduh surat.');
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `surat-ujian-${attemptId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Surat berhasil diunduh.');
        } catch {
            toast.error('Gagal mengunduh surat. Periksa koneksi internet.');
        } finally {
            setDownloadingLetterId(null);
        }
    };

    const pushQuery = (
        next: Partial<{
            page: number; per_page: number; q: string;
            status: StatusFilter; sort_by: SortBy;
            sort_dir: SortDirection; freeze: FreezeFilter;
        }>,
    ) => {
        router.get(
            baseUrl,
            {
                page:     next.page     ?? attempts.current_page ?? 1,
                per_page: next.per_page ?? rowsPerPage,
                q:        next.q        ?? searchQuery,
                status:   next.status   ?? statusFilter,
                sort_by:  next.sort_by  ?? sortBy,
                sort_dir: next.sort_dir ?? sortDirection,
                freeze:   next.freeze   ?? freezeFilter,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const toggleSortDirection = () => {
        const nextDir: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(nextDir);
        pushQuery({ page: 1, sort_dir: nextDir });
    };

    const pageAttempts = useMemo(() => attempts.data ?? [], [attempts.data]);
    const allSelected  =
        pageAttempts.length > 0 &&
        pageAttempts.every((a) => selectedAttemptIds.includes(a.id));
    const selectedFrozenIds = useMemo(
        () => selectedAttemptIds.filter((id) =>
            pageAttempts.some((a) => a.id === id && (a.is_frozen || a.status === 'frozen')),
        ),
        [pageAttempts, selectedAttemptIds],
    );

    useEffect(() => { setSelectedAttemptIds([]); }, [pageAttempts]);

    const handleUnfreezeClick = (attempt: Attempt) => {
        setSelectedAttempt(attempt);
        setUnfreezeDialogOpen(true);
    };

    const handleConfirmUnfreeze = () => {
        if (!selectedAttempt) return;
        router.post(
            `/admin/exams/attempts/${selectedAttempt.id}/unfreeze`,
            {},
            { preserveScroll: true, onFinish: () => { setUnfreezeDialogOpen(false); setSelectedAttempt(null); } },
        );
    };

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
                        <h1 className="text-3xl font-bold">Percobaan — {exam.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau kinerja siswa dan data percobaan secara rinci.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <a href={`/admin/exams/${exam.id}/export-results`}>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Ekspor Nilai (CSV)
                            </Button>
                        </a>
                        {irtProcessed && (
                            <a href={`/admin/exams/${exam.id}/irt-export`}>
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download IRT Results
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[
                        { label: 'Total Percobaan (Selesai)', value: analytics.total_attempts, color: '' },
                        { label: 'Lulus', value: analytics.passed, color: 'text-green-600' },
                        { label: 'Tingkat Kelulusan', value: `${passRate.toFixed(1)}%`, color: '' },
                        { label: 'Skor Rata-rata', value: averageScore.toFixed(2), color: '' },
                    ].map(({ label, value, color }) => (
                        <Card key={label}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Cari nama atau email siswa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') pushQuery({ page: 1, q: searchQuery }); }}
                            />
                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">Tekan Enter</InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); pushQuery({ page: 1, status: v as StatusFilter }); }}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status hasil" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Hasil</SelectItem>
                                <SelectItem value="passed">Lulus</SelectItem>
                                <SelectItem value="failed">Gagal</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={freezeFilter} onValueChange={(v) => { setFreezeFilter(v as FreezeFilter); pushQuery({ page: 1, freeze: v as FreezeFilter }); }}>
                            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status freeze" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="frozen">Dibekukan</SelectItem>
                                <SelectItem value="not_frozen">Tidak Dibekukan</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortBy); pushQuery({ page: 1, sort_by: v as SortBy }); }}>
                                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Waktu Mulai</SelectItem>
                                    <SelectItem value="name">Nama Siswa</SelectItem>
                                    <SelectItem value="score">Skor</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={toggleSortDirection} className="shrink-0">
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {pageAttempts.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Tidak ada percobaan yang ditemukan dengan filter saat ini.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-muted-foreground">{selectedAttemptIds.length} dipilih</div>
                            <Button
                                variant="outline"
                                disabled={selectedFrozenIds.length === 0}
                                onClick={() =>
                                    router.post(
                                        `/admin/exams/${exam.id}/attempts/unfreeze-bulk`,
                                        { attempt_ids: selectedFrozenIds },
                                        { preserveScroll: true, onFinish: () => setSelectedAttemptIds([]) },
                                    )
                                }
                            >
                                Buka masal
                            </Button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={() =>
                                                    setSelectedAttemptIds(allSelected ? [] : pageAttempts.map((a) => a.id))
                                                }
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Universitas</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Jurusan</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Status Ujian</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Skor UTBK {!irtProcessed && <span className="text-muted-foreground font-normal">(belum diproses)</span>}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Waktu Pengambilan</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {pageAttempts.map((attempt) => {
                                        const isPassed = attempt.is_passed;

                                        // ── Score ─────────────────────────────────────────────────
                                        // Show skor_utbk_pct if IRT processed, else "-"
                                        const skorCell = (() => {
                                            if (!irtProcessed || attempt.skor_utbk_pct == null) {
                                                return (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                );
                                            }
                                            const pct = Number(attempt.skor_utbk_pct);
                                            return (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                        isPassed
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {pct.toFixed(2)}%
                                                </span>
                                            );
                                        })();

                                        // ── Duration ──────────────────────────────────────────────
                                        const startedDate   = parseDate(attempt.started_at);
                                        const completedDate = parseDate(attempt.completed_at);
                                        const durationCell  = (() => {
                                            if (!startedDate || !completedDate) {
                                                return <span className="text-xs text-muted-foreground">-</span>;
                                            }
                                            const mins = Math.round(
                                                Math.abs(completedDate.getTime() - startedDate.getTime()) / 60000,
                                            );
                                            const label = formatDuration(mins);
                                            return label === '-'
                                                ? <span className="text-xs text-muted-foreground">-</span>
                                                : <span>{label}</span>;
                                        })();

                                        // ── Status badge ──────────────────────────────────────────
                                        let statusBadge = (
                                            <Badge variant="outline" className="text-xs">{attempt.status}</Badge>
                                        );
                                        if (attempt.is_frozen || attempt.status === 'frozen') {
                                            statusBadge = <Badge variant="destructive" className="text-xs">Dibekukan</Badge>;
                                        } else if (attempt.status === 'in_progress') {
                                            statusBadge = <Badge variant="outline" className="text-xs">Sedang dikerjakan</Badge>;
                                        } else if (attempt.status === 'submitted') {
                                            statusBadge = <Badge variant="default" className="text-xs">Selesai</Badge>;
                                        }

                                        return (
                                            <tr key={attempt.id} className="transition-colors hover:bg-foreground/5">
                                                <td className="px-6 py-3">
                                                    <Checkbox
                                                        checked={selectedAttemptIds.includes(attempt.id)}
                                                        onCheckedChange={() =>
                                                            setSelectedAttemptIds((prev) =>
                                                                prev.includes(attempt.id)
                                                                    ? prev.filter((id) => id !== attempt.id)
                                                                    : [...prev, attempt.id],
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-medium">{attempt.student.name}</div>
                                                    <div className="text-xs text-muted-foreground">{attempt.student.email}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {attempt.student.university?.name ?? (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {attempt.student.major?.name ?? '-'}
                                                </td>
                                                <td className="px-6 py-3">{statusBadge}</td>
                                                <td className="px-6 py-3">{skorCell}</td>
                                                <td className="px-6 py-3">{durationCell}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <ActionIconTooltip label="Detail">
                                                            <Button asChild variant="outline" size="icon">
                                                                <Link href={`/admin/attempts/${attempt.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </ActionIconTooltip>

                                                        {exam.irt_processed_at && (
                                                            <ActionIconTooltip label="Unduh Surat">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    disabled={downloadingLetterId === attempt.id}
                                                                    onClick={() => handleDownloadLetter(attempt.id)}
                                                                >
                                                                    {downloadingLetterId === attempt.id
                                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                        : <FileText className="h-4 w-4" />
                                                                    }
                                                                </Button>
                                                            </ActionIconTooltip>
                                                        )}
                                                        {(attempt.is_frozen || attempt.status === 'frozen') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUnfreezeClick(attempt)}
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
                    </div>
                )}

                {/* Footer pagination */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {pageAttempts.length} dari {attempts.total} data.
                    </div>
                    <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Baris per halaman:</span>
                            <Select
                                value={String(rowsPerPage)}
                                onValueChange={(v) => { const n = Number(v) || 10; setRowsPerPage(n); pushQuery({ page: 1, per_page: n }); }}
                            >
                                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 50].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {attempts.current_page > 1 ? (
                                        <button type="button" onClick={() => pushQuery({ page: attempts.current_page - 1 })} className="cursor-pointer">
                                            <PaginationPrevious />
                                        </button>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>
                                {getPaginationRange(attempts.current_page, attempts.last_page).map((page) => (
                                    <PaginationItem key={page}>
                                        <button type="button" onClick={() => pushQuery({ page })} className="cursor-pointer">
                                            <PaginationLink isActive={page === attempts.current_page}>{page}</PaginationLink>
                                        </button>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    {attempts.current_page < attempts.last_page ? (
                                        <button type="button" onClick={() => pushQuery({ page: attempts.current_page + 1 })} className="cursor-pointer">
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
                    onOpenChange={(open) => { setUnfreezeDialogOpen(open); if (!open) setSelectedAttempt(null); }}
                    studentName={selectedAttempt?.student.name}
                    onConfirm={handleConfirmUnfreeze}
                />
            </div>
        </AppLayout>
    );
}