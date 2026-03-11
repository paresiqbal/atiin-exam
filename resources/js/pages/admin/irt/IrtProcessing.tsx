import { Head, router } from '@inertiajs/react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface School {
    id: number;
    name: string;
}

interface ExamItem {
    id: number;
    name: string;
    end_at: string | null;
    attempts_count: number;
    submitted_attempts_count: number;
    irt_processed_at: string | null;
    school: School | null;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

type StatusFilter = 'all' | 'processed' | 'not_processed';

interface Props {
    exams: Paginated<ExamItem>;
    schools: School[];
    classes: string[];
    filters?: {
        search?: string;
        school_id?: string | number | null;
        class?: string | null;
        status?: StatusFilter | null;
    };
}

export default function IrtProcessing({
    exams,
    schools,
    classes,
    filters,
}: Props) {
    const initialSearch = filters?.search ?? '';
    const initialSchoolId = filters?.school_id
        ? String(filters.school_id)
        : 'all';
    const initialClassFilter = filters?.class?.trim() ? filters.class : 'all';
    const initialStatusFilter = filters?.status?.trim()
        ? filters.status
        : 'all';

    const [search, setSearch] = useState(initialSearch);
    const [schoolId, setSchoolId] = useState(initialSchoolId);
    const [classFilter, setClassFilter] = useState(initialClassFilter);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        initialStatusFilter as StatusFilter,
    );
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const classOptions = useMemo(
        () => classes.filter((cls) => cls.trim() !== ''),
        [classes],
    );
    const rows = useMemo(() => exams.data ?? [], [exams.data]);
    const allSelected =
        rows.length > 0 && rows.every((exam) => selectedIds.includes(exam.id));

    const applyFilters = (next?: Partial<Record<string, string>>) => {
        router.get(
            '/admin/irt',
            {
                search: (next?.search ?? search) || undefined,
                school_id:
                    (next?.school_id ?? schoolId) !== 'all'
                        ? (next?.school_id ?? schoolId)
                        : undefined,
                class:
                    (next?.class ?? classFilter) !== 'all'
                        ? (next?.class ?? classFilter)
                        : undefined,
                status:
                    (next?.status ?? statusFilter) !== 'all'
                        ? (next?.status ?? statusFilter)
                        : undefined,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    // Process or force-reprocess a single exam
    const handleProcess = (exam: ExamItem, force = false) => {
        setProcessingId(exam.id);
        router.post(
            `/admin/irt/process/${exam.id}`,
            { force },
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    // Bulk process selected exams; force=true reprocesses already-processed ones
    const handleProcessSelected = (force = false) => {
        router.post(
            '/admin/irt/process-multiple',
            { exam_ids: selectedIds, force },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ujian', href: '/admin/exams' },
                { title: 'IRT', href: '/admin/irt' },
            ]}
        >
            <Head title="IRT Processing" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-3xl font-bold">IRT Processing</h1>
                    <p className="text-sm text-muted-foreground">
                        Jalankan Rasch IRT secara manual setelah ujian selesai.
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search exam title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') applyFilters();
                                    }}
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => applyFilters()}
                            >
                                Apply
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <Select
                                value={schoolId}
                                onValueChange={(val) => {
                                    setSchoolId(val);
                                    applyFilters({ school_id: val });
                                }}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Filter School" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Sekolah
                                    </SelectItem>
                                    {schools.map((school) => (
                                        <SelectItem
                                            key={school.id}
                                            value={String(school.id)}
                                        >
                                            {school.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={classFilter}
                                onValueChange={(val) => {
                                    setClassFilter(val);
                                    applyFilters({ class: val });
                                }}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kelas
                                    </SelectItem>
                                    {classOptions.map((cls) => (
                                        <SelectItem key={cls} value={cls}>
                                            {cls}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val as StatusFilter);
                                    applyFilters({ status: val });
                                }}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="processed">
                                        Processed
                                    </SelectItem>
                                    <SelectItem value="not_processed">
                                        Not Processed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk action bar */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dipilih
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={selectedIds.length === 0}
                            onClick={() => handleProcessSelected(false)}
                        >
                            Process Selected
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={selectedIds.length === 0}
                            onClick={() => handleProcessSelected(true)}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Force Reprocess Selected
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={() => {
                                            setSelectedIds(
                                                allSelected
                                                    ? []
                                                    : rows.map((r) => r.id),
                                            );
                                        }}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Exam
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    School
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Attempts
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    IRT Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-center text-muted-foreground"
                                        colSpan={6}
                                    >
                                        Tidak ada ujian ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((exam) => {
                                    const processed = !!exam.irt_processed_at;
                                    const attemptsLabel =
                                        exam.submitted_attempts_count ??
                                        exam.attempts_count;
                                    const isProcessing =
                                        processingId === exam.id;

                                    return (
                                        <tr key={exam.id}>
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selectedIds.includes(
                                                        exam.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        setSelectedIds(
                                                            (prev) =>
                                                                prev.includes(
                                                                    exam.id,
                                                                )
                                                                    ? prev.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              exam.id,
                                                                      )
                                                                    : [
                                                                          ...prev,
                                                                          exam.id,
                                                                      ],
                                                        );
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {exam.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {exam.school?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {attemptsLabel}
                                            </td>
                                            <td className="px-4 py-3">
                                                {processed ? (
                                                    <Badge variant="default">
                                                        Processed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Not Processed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {processed ? (
                                                    // Already processed → Reprocess + Export
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                handleProcess(
                                                                    exam,
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                        <RefreshCw
                                                            className={`mr-1 h-3 w-3 ${
                                                                isProcessing
                                                                    ? 'animate-spin'
                                                                    : ''
                                                            }`}
                                                        />
                                                            {isProcessing
                                                                ? 'Processing…'
                                                                : 'Reprocess'}
                                                        </Button>
                                                        <a
                                                            href={`/admin/irt/export/${exam.id}`}
                                                            download
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                            >
                                                                <Download className="mr-1 h-3 w-3" />
                                                                Export
                                                            </Button>
                                                        </a>
                                                    </div>
                                                ) : (
                                                    // Not yet processed → normal Process button
                                                    <Button
                                                        size="sm"
                                                        disabled={isProcessing}
                                                        onClick={() =>
                                                            handleProcess(
                                                                exam,
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        {isProcessing
                                                            ? 'Processing…'
                                                            : 'Process'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
