import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Mail, Search, User2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import ActionIconTooltip from '@/components/ActionIconTooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Eye } from 'lucide-react';

interface School {
    id: number;
    name: string;
}
interface University {
    id: number;
    name: string;
}
interface Major {
    id: number;
    name: string;
    minimum_passing_grade?: number | null;
}

interface Student {
    id: number;
    name: string;
    email: string;
    class?: string | null;
    school?: School | null;
    university?: University | null;
    major?: Major | null;
    created_at?: string;
}

interface ExamAttempt {
    id: number;
    status: string;
    skor_utbk_pct: number | null; // null = IRT not processed
    irt_processed: boolean;
    passing_score: number;
    is_passed: boolean | null; // null = not submitted
    started_at?: string | null;
    completed_at?: string | null;
    exam: { id: number; name: string };
}

interface Props extends InertiaPageProps {
    student: Student;
    exam_attempts: ExamAttempt[];
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function breadcrumbs(student: Student): BreadcrumbItem[] {
    return [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Siswa', href: '/admin/students' },
        { title: student.name, href: '#' },
    ];
}

export default function StudentShow() {
    const { student, exam_attempts } = usePage<Props>().props;

    // ── Summary stats ────────────────────────────────────────────────────────
    const { totalExams, avgSkorUtbk, lastExamAt, passedCount, irtCount } =
        useMemo(() => {
            const submitted = exam_attempts.filter(
                (a) => a.status === 'submitted',
            );
            if (submitted.length === 0) {
                return {
                    totalExams: 0,
                    avgSkorUtbk: null,
                    lastExamAt: null,
                    passedCount: 0,
                    irtCount: 0,
                };
            }

            const sorted = [...submitted].sort(
                (a, b) =>
                    new Date(b.completed_at ?? 0).getTime() -
                    new Date(a.completed_at ?? 0).getTime(),
            );

            const irtAttempts = submitted.filter(
                (a) => a.irt_processed && a.skor_utbk_pct !== null,
            );
            const avg =
                irtAttempts.length > 0
                    ? irtAttempts.reduce(
                          (sum, a) => sum + (a.skor_utbk_pct ?? 0),
                          0,
                      ) / irtAttempts.length
                    : null;

            const passed = submitted.filter((a) => a.is_passed === true).length;

            return {
                totalExams: submitted.length,
                avgSkorUtbk: avg,
                lastExamAt: sorted[0]?.completed_at ?? null,
                passedCount: passed,
                irtCount: irtAttempts.length,
            };
        }, [exam_attempts]);

    // ── Search + pagination ──────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return exam_attempts;
        return exam_attempts.filter(
            (a) =>
                a.exam.name.toLowerCase().includes(q) ||
                formatDateTime(a.completed_at).toLowerCase().includes(q),
        );
    }, [exam_attempts, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    return (
        <AppLayout breadcrumbs={breadcrumbs(student)}>
            <Head title={`Detail Siswa — ${student.name}`} />

            <div className="space-y-6 p-4">
                {/* ── Header ── */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Detail Siswa</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Profil dan riwayat ujian
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2 self-start"
                    >
                        <Link href="/admin/students">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* ── Profile + Stats ── */}
                <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
                    {/* Profile */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <User2 className="h-5 w-5 text-primary" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-xl font-bold">
                                        {student.name}
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        ID: {student.id}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate font-mono">
                                    {student.email}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="mb-0.5 text-xs text-muted-foreground">
                                        Sekolah
                                    </p>
                                    <p className="font-medium">
                                        {student.school?.name ?? (
                                            <span className="text-muted-foreground italic">
                                                -
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-xs text-muted-foreground">
                                        Kelas
                                    </p>
                                    <p className="font-medium">
                                        {student.class ?? '-'}
                                    </p>
                                </div>
                            </div>
                            {student.created_at && (
                                <p className="text-xs text-muted-foreground">
                                    Terdaftar:{' '}
                                    {formatDateTime(student.created_at)}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                                Ringkasan Performa
                            </CardTitle>
                            <CardDescription>
                                Dari ujian yang telah diselesaikan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">
                                        Total Ujian Selesai
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {totalExams}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">
                                        Rata-rata Skor UTBK
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {avgSkorUtbk !== null ? (
                                            `${avgSkorUtbk.toFixed(2)}%`
                                        ) : (
                                            <span className="text-base text-muted-foreground">
                                                Belum IRT
                                            </span>
                                        )}
                                    </p>
                                    {irtCount > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {irtCount} ujian IRT diproses
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">
                                        Lulus
                                    </p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {passedCount}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">
                                        Tidak Lulus
                                    </p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {totalExams - passedCount}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                Terakhir ujian:{' '}
                                {lastExamAt ? formatDateTime(lastExamAt) : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Exam history ── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Ujian</CardTitle>
                        <CardDescription>
                            Semua ujian yang pernah diikuti
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exam_attempts.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                Belum ada riwayat ujian.
                            </p>
                        ) : (
                            <>
                                {/* Search */}
                                <div className="mb-4">
                                    <InputGroup className="max-w-sm">
                                        <InputGroupAddon>
                                            <Search className="h-4 w-4 text-slate-500" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            placeholder="Cari nama ujian..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                        {search && (
                                            <InputGroupAddon align="inline-end">
                                                {filtered.length} hasil
                                            </InputGroupAddon>
                                        )}
                                    </InputGroup>
                                </div>

                                <div className="overflow-x-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ujian</TableHead>
                                                <TableHead>
                                                    Tanggal Selesai
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Skor UTBK
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Passing Grade
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Aksi
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map((attempt) => (
                                                <TableRow key={attempt.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {attempt.exam.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ID #{attempt.id}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell className="text-sm">
                                                        {formatDateTime(
                                                            attempt.completed_at,
                                                        )}
                                                    </TableCell>

                                                    {/* Skor UTBK */}
                                                    <TableCell className="text-center">
                                                        {attempt.irt_processed &&
                                                        attempt.skor_utbk_pct !==
                                                            null ? (
                                                            <span className="font-semibold">
                                                                {attempt.skor_utbk_pct.toFixed(
                                                                    2,
                                                                )}
                                                                %
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                {attempt.status ===
                                                                'submitted'
                                                                    ? 'Belum IRT'
                                                                    : '-'}
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* Passing grade */}
                                                    <TableCell className="text-center text-sm">
                                                        {attempt.passing_score ??
                                                            '-'}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="text-center">
                                                        {attempt.status !==
                                                        'submitted' ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs capitalize"
                                                            >
                                                                {attempt.status ===
                                                                'in_progress'
                                                                    ? 'Berlangsung'
                                                                    : attempt.status ===
                                                                        'frozen'
                                                                      ? 'Dibekukan'
                                                                      : attempt.status}
                                                            </Badge>
                                                        ) : attempt.is_passed ===
                                                          true ? (
                                                            <Badge className="bg-green-600 text-xs text-white hover:bg-green-700">
                                                                Lulus
                                                            </Badge>
                                                        ) : attempt.is_passed ===
                                                          false ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-red-300 text-xs text-red-600"
                                                            >
                                                                Tidak Lulus
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                Belum IRT
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <ActionIconTooltip label="Detail">
                                                            <Button
                                                                asChild
                                                                size="icon"
                                                                variant="ghost"
                                                            >
                                                                <Link
                                                                    href={`/admin/attempts/${attempt.id}`}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </ActionIconTooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <p className="text-muted-foreground">
                                            Halaman {page} dari {totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page === 1}
                                                onClick={() =>
                                                    setPage((p) => p - 1)
                                                }
                                            >
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page === totalPages}
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                            >
                                                Selanjutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
