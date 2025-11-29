import { Head, Link } from '@inertiajs/react';
import { ArrowUpDown, Download, Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import AppLayout from '@/layouts/app-layout';

interface Attempt {
    id: number;
    score: number;
    total_score: number;
    percentage: number;
    is_passed: boolean;
    started_at: string;
    completed_at: string;
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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    exam: {
        id: number;
        name: string;
    };
    attempts: {
        data: Attempt[];
        links: PaginationLink[];
    };
    analytics: Analytics;
}

type StatusFilter = 'all' | 'passed' | 'failed';
type SortBy = 'name' | 'score' | 'date';
type SortDirection = 'asc' | 'desc';

export default function ExamAttempts({ exam, attempts, analytics }: Props) {
    const averageScore = Number(analytics.average_score ?? 0);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
    const [endDate, setEndDate] = useState(''); // yyyy-mm-dd
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const processedAttempts = useMemo(() => {
        let list = [...attempts.data];

        const q = searchQuery.toLowerCase().trim();

        // Search filter
        if (q) {
            list = list.filter((attempt) => {
                const name = attempt.student.name.toLowerCase();
                const email = attempt.student.email.toLowerCase();
                return name.includes(q) || email.includes(q);
            });
        }

        // Status filter
        list = list.filter((attempt) => {
            // Derive percentage
            const rawScore = Number(attempt.score ?? 0);
            const percent =
                attempt.total_score && attempt.total_score > 0
                    ? (rawScore / attempt.total_score) * 100
                    : rawScore;

            const isPassed =
                typeof attempt.is_passed === 'boolean'
                    ? attempt.is_passed
                    : percent >= 60;

            if (statusFilter === 'passed') return isPassed;
            if (statusFilter === 'failed') return !isPassed;
            return true;
        });

        // Date range filter (based on completed_at date only)
        list = list.filter((attempt) => {
            if (!attempt.completed_at) return false;

            const completed = new Date(attempt.completed_at);

            if (startDate) {
                const from = new Date(startDate + 'T00:00:00');
                if (completed < from) return false;
            }

            if (endDate) {
                const to = new Date(endDate + 'T23:59:59');
                if (completed > to) return false;
            }

            return true;
        });

        // Sorting
        list.sort((a, b) => {
            let cmp = 0;

            if (sortBy === 'name') {
                const an = a.student.name.toLowerCase();
                const bn = b.student.name.toLowerCase();
                cmp = an.localeCompare(bn);
            } else if (sortBy === 'score') {
                const as = Number(a.score ?? 0);
                const bs = Number(b.score ?? 0);
                cmp = as - bs;
            } else if (sortBy === 'date') {
                const ad = a.completed_at
                    ? new Date(a.completed_at).getTime()
                    : 0;
                const bd = b.completed_at
                    ? new Date(b.completed_at).getTime()
                    : 0;
                cmp = ad - bd;
            }

            return sortDirection === 'asc' ? cmp : -cmp;
        });

        return list;
    }, [
        attempts.data,
        searchQuery,
        statusFilter,
        startDate,
        endDate,
        sortBy,
        sortDirection,
    ]);

    const passRate =
        analytics.total_attempts > 0
            ? (analytics.passed / analytics.total_attempts) * 100
            : 0;

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Exams', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
                { title: 'Attempts', href: '#' },
            ]}
        >
            <Head title={`${exam.name} - Attempts`} />

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

                    <a
                        href={`/admin/exams/${exam.id}/export-results`}
                        className="inline-flex items-center gap-2"
                    >
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Ekspor ke CSV
                        </Button>
                    </a>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Percobaan
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
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {processedAttempts.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    {/* Filters & sort */}
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        {/* Status filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(val: StatusFilter) =>
                                setStatusFilter(val)
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Status
                                </SelectItem>
                                <SelectItem value="passed">Lulus</SelectItem>
                                <SelectItem value="failed">Gagal</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date range */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Filter className="h-3 w-3" />
                                Tanggal:
                            </div>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 rounded-md border px-2 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">
                                sampai
                            </span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 rounded-md border px-2 text-xs"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={sortBy}
                                onValueChange={(val: SortBy) => setSortBy(val)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">
                                        Tanggal Selesai
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
                {processedAttempts.length === 0 ? (
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
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Skor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Waktu Pengambilan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Tanggal Selesai
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {processedAttempts.map((attempt) => {
                                    const rawScore = Number(attempt.score ?? 0);

                                    const percent =
                                        attempt.total_score &&
                                        attempt.total_score > 0
                                            ? (rawScore / attempt.total_score) *
                                              100
                                            : rawScore;

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

                                            {/* Pass/Fail Badge */}
                                            <td className="px-6 py-3 text-sm">
                                                <Badge
                                                    variant={
                                                        isPassed
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {isPassed
                                                        ? 'Passed'
                                                        : 'Failed'}
                                                </Badge>
                                            </td>

                                            {/* Score pill */}
                                            <td className="px-6 py-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                        isPassed
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {attempt.total_score
                                                        ? `${rawScore}/${attempt.total_score} (${percent.toFixed(2)}%)`
                                                        : `${percent.toFixed(2)}%`}
                                                </span>
                                            </td>

                                            {/* Time taken */}
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

                                            {/* Completed date */}
                                            <td className="px-6 py-3 text-sm">
                                                {attempt.completed_at ? (
                                                    new Date(
                                                        attempt.completed_at,
                                                    ).toLocaleString()
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-3 text-sm">
                                                <Link
                                                    href={`/admin/attempts/${attempt.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Lihat Detail
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Simple pagination from Laravel links */}
                {attempts.links.length > 1 && (
                    <div className="mt-4 flex justify-center gap-1 text-sm">
                        {attempts.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                className={`rounded-md border px-3 py-1 ${
                                    link.active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : link.url
                                          ? 'border-transparent hover:bg-muted'
                                          : 'pointer-events-none text-muted-foreground'
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
