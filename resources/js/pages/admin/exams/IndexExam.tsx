import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Edit2,
    Eye,
    Plus,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

import type { BreadcrumbItem } from '@/types';
import type { ExamData } from '@/types/exam';
import type { Paginated } from '@/types/pagination';

type StatusFilter = 'all' | 'published' | 'draft';

const baseUrl = '/admin/exams';

export default function IndexExam({ exams }: { exams: Paginated<ExamData> }) {
    const data = useMemo(() => exams.data ?? [], [exams.data]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (exams as Paginated<ExamData>).per_page ?? 10,
    );

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Ujian', href: baseUrl },
    ];

    const filteredExams = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return data.filter((exam) => {
            const nameMatch = exam.name.toLowerCase().includes(q);
            const bankMatch = (exam.question_banks ?? []).some((b) =>
                b.name?.toLowerCase().includes(q),
            );
            const matchesSearch = nameMatch || bankMatch;

            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'published'
                      ? exam.is_published
                      : !exam.is_published;

            let matchesDate = true;

            if ((startDate || endDate) && exam.created_at) {
                const created = new Date(exam.created_at);

                if (startDate && created < startDate) {
                    matchesDate = false;
                }

                if (endDate && created > endDate) {
                    matchesDate = false;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [data, searchQuery, statusFilter, startDate, endDate]);

    // selection logic (same as StudentIndex)
    const allSelected = useMemo(
        () =>
            filteredExams.length > 0 &&
            filteredExams.every((exam) => selectedIds.includes(exam.id)),
        [filteredExams, selectedIds],
    );

    const someSelected =
        selectedIds.length > 0 && selectedIds.length < filteredExams.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredExams.map((e) => e.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !filteredExams.some((e) => e.id === id)),
            );
        }
    };

    const handleToggleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
            );
        } else {
            setSelectedIds((prev) =>
                prev.filter((selectedId) => selectedId !== id),
            );
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        return router.delete(`${baseUrl}/bulk-delete`, {
            data: {
                ids: selectedIds,
            },
            onSuccess: () => {
                setSelectedIds([]);
            },
        });
    };

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 10;
        setRowsPerPage(perPage);

        router.get(
            `${baseUrl}`,
            { page: 1, per_page: perPage },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Ujian" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Daftar Ujian</h1>
                        <p className="text-muted-foreground">
                            Kelola ujian yang tersedia untuk sekolah Anda
                        </p>
                    </div>

                    <div>
                        <Link href={`${baseUrl}/create`}>
                            <Button>
                                Buat Ujian <Plus />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters row: search, status, date range, bulk delete */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Search */}
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama ujian atau bank soal..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredExams.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) =>
                                setStatusFilter(value as StatusFilter)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="published">
                                    Publis
                                </SelectItem>
                                <SelectItem value="draft">Draf</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Start date */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-[160px] justify-start"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate
                                        ? startDate.toLocaleDateString('id-ID')
                                        : 'Dari tanggal'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* End date */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-[160px] justify-start"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate
                                        ? endDate.toLocaleDateString('id-ID')
                                        : 'Sampai tanggal'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Bulk delete */}
                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="ujian"
                            disabled={selectedIds.length === 0}
                            onConfirm={handleBulkDelete}
                        />
                    </div>
                </div>

                {/* TABLE – UI copied from StudentIndex */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-primary/10 dark:bg-primary/60">
                            <tr>
                                <th className="w-10 px-4 py-2">
                                    <Checkbox
                                        checked={checkboxValue}
                                        onCheckedChange={(value) =>
                                            handleToggleSelectAll(
                                                value === true,
                                            )
                                        }
                                        className="border-gray-900"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Nama Ujian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Bank Soal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Tanggal Dibuat
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                    Peserta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredExams.length > 0 ? (
                                filteredExams.map((exam) => {
                                    const isSelected = selectedIds.includes(
                                        exam.id,
                                    );

                                    return (
                                        <tr
                                            key={exam.id}
                                            className={cn(
                                                'transition-colors hover:bg-accent',
                                                isSelected && 'bg-accent',
                                            )}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            exam.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2">
                                                {exam.name}
                                            </td>

                                            <td className="px-6 py-2">
                                                {exam.question_banks?.length ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {exam.question_banks
                                                            .slice(0, 2)
                                                            .map((b) => (
                                                                <Badge
                                                                    key={b.id}
                                                                    variant="outline"
                                                                >
                                                                    {b.name}
                                                                </Badge>
                                                            ))}
                                                        {exam.question_banks
                                                            .length > 2 && (
                                                            <Badge variant="secondary">
                                                                +
                                                                {exam
                                                                    .question_banks
                                                                    .length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2">
                                                {formatDate(exam.created_at)}
                                            </td>

                                            <td className="px-6 py-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs',
                                                        exam.is_published
                                                            ? 'border-green-500 text-green-700'
                                                            : 'border-yellow-500 text-yellow-700',
                                                    )}
                                                >
                                                    {exam.is_published
                                                        ? 'Publis'
                                                        : 'Draf'}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-2 text-center">
                                                {exam.attempts_count ?? 0}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        size="icon"
                                                        variant="ghost"
                                                        className="hover:bg-foreground/10"
                                                    >
                                                        <Link
                                                            href={`${baseUrl}/${exam.id}`}
                                                            aria-label={`Lihat detail ujian ${exam.name}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        asChild
                                                        size="icon"
                                                        variant="ghost"
                                                        className="hover:bg-foreground/10"
                                                    >
                                                        <Link
                                                            href={`${baseUrl}/${exam.id}/edit`}
                                                            aria-label={`Edit ujian ${exam.name}`}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${exam.id}`}
                                                        resourceLabel="ujian"
                                                        itemName={exam.name}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-8 text-center text-slate-500"
                                    >
                                        Tidak ada ujian yang cocok dengan
                                        filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER: selection + Baris per halaman + pagination (copied style) */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {exams.total} baris dipilih.
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
                                    {exams.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                exams.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {Array.from(
                                    { length: exams.last_page },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page === exams.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {exams.current_page < exams.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                exams.current_page + 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationNext />
                                        </Link>
                                    ) : (
                                        <PaginationNext className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
