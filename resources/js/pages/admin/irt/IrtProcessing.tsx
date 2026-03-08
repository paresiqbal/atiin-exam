import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function IrtProcessing({ exams, schools, classes, filters }: Props) {
    const initialSearch = filters?.search ?? '';
    const initialSchoolId = filters?.school_id
        ? String(filters.school_id)
        : 'all';
    const initialClassFilter =
        filters?.class && filters.class.trim() !== ''
            ? filters.class
            : 'all';
    const initialStatusFilter =
        filters?.status && filters.status.trim() !== ''
            ? filters.status
            : 'all';

    const [search, setSearch] = useState(initialSearch);
    const [schoolId, setSchoolId] = useState(initialSchoolId);
    const [classFilter, setClassFilter] = useState(initialClassFilter);
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>(initialStatusFilter as StatusFilter);

    const classOptions = useMemo(
        () => classes.filter((cls) => cls.trim() !== ''),
        [classes],
    );

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const applyFilters = (next?: Partial<Record<string, string>>) => {
        const nextSchoolId = next?.school_id ?? schoolId;
        const nextClass = next?.class ?? classFilter;
        const nextStatus = next?.status ?? statusFilter;
        const nextSearch = next?.search ?? search;

        router.get(
            '/admin/irt',
            {
                search: nextSearch || undefined,
                school_id: nextSchoolId !== 'all' ? nextSchoolId : undefined,
                class: nextClass !== 'all' ? nextClass : undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const rows = useMemo(() => exams.data ?? [], [exams.data]);
    const allSelected =
        rows.length > 0 && rows.every((exam) => selectedIds.includes(exam.id));

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

                <Card>
                    <CardContent className="space-y-4 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dipilih
                    </div>
                    <Button
                        variant="outline"
                        disabled={selectedIds.length === 0}
                        onClick={() =>
                            router.post(
                                '/admin/irt/process-multiple',
                                { exam_ids: selectedIds },
                                { preserveScroll: true },
                            )
                        }
                    >
                        Process Selected Exams
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={() => {
                                            if (allSelected) {
                                                setSelectedIds([]);
                                                return;
                                            }
                                            setSelectedIds(rows.map((r) => r.id));
                                        }}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                                    Exam
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                                    School
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                                    Attempts
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                                    IRT Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-center text-muted-foreground"
                                        colSpan={5}
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

                                    return (
                                        <tr key={exam.id}>
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selectedIds.includes(
                                                        exam.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        setSelectedIds((prev) =>
                                                            prev.includes(
                                                                exam.id,
                                                            )
                                                                ? prev.filter(
                                                                      (id) =>
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
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {exam.name}
                                                </div>
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
