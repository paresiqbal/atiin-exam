'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
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

type UserMini = { id: number; name: string; email?: string };

type ConsultantRequestRow = {
    id: number;
    topic: string;
    status: 'pending' | 'approved' | 'rejected' | 'done' | string;
    created_at: string;
    student: UserMini;
    consultant: UserMini;
};

type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type Filters = {
    status?: string | null;
    search?: string | null;
    per_page?: number | null;
};

type PageProps = {
    requests: Paginated<ConsultantRequestRow>;
    filters: Filters;
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const baseUrl = '/admin/consultant-requests';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Consultant Requests', href: baseUrl },
];

function statusVariant(s: ConsultantRequestRow['status']): BadgeVariant {
    switch (s) {
        case 'pending':
            return 'secondary';
        case 'approved':
            return 'default';
        case 'rejected':
            return 'destructive';
        case 'done':
            return 'outline';
        default:
            return 'secondary';
    }
}

function formatDateTime(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function makeQuery(params: {
    page: number;
    perPage: number;
    search: string;
    status: string;
}) {
    const qs = new URLSearchParams();
    qs.set('page', String(params.page));
    qs.set('per_page', String(params.perPage));
    if (params.search.trim() !== '') qs.set('search', params.search.trim());
    if (params.status.trim() !== '') qs.set('status', params.status.trim());
    return `${baseUrl}?${qs.toString()}`;
}

export default function ConsultIndex() {
    const { requests, filters } = usePage<PageProps>().props;

    const data = useMemo(() => requests.data ?? [], [requests.data]);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (filters?.per_page ?? requests.per_page ?? 15) as number,
    );

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Live search (debounced) + status change also triggers
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const t = setTimeout(() => {
            router.get(
                baseUrl,
                {
                    search: search.trim() || undefined,
                    status: status || undefined,
                    page: 1,
                    per_page: rowsPerPage,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 350);

        return () => clearTimeout(t);
    }, [search, status, rowsPerPage]);

    const allSelected = useMemo(
        () => data.length > 0 && data.every((r) => selectedIds.includes(r.id)),
        [data, selectedIds],
    );

    const someSelected = selectedIds.length > 0 && !allSelected;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => {
                const merged = new Set([...prev, ...data.map((r) => r.id)]);
                return Array.from(merged);
            });
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !data.some((r) => r.id === id)),
            );
        }
    };

    const handleToggleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
            );
        } else {
            setSelectedIds((prev) => prev.filter((x) => x !== id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        router.delete(`${baseUrl}/bulk-delete`, {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 15;
        setRowsPerPage(perPage);

        router.get(
            baseUrl,
            {
                page: 1,
                per_page: perPage,
                search: search.trim() || undefined,
                status: status || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permintaan Konsultasi" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Permintaan Konsultasi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola permintaan konsultasi antara siswa dan
                        </p>
                    </div>
                </div>

                {/* Search + Status + Bulk */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari topik / siswa / konsultan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {search !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {requests.total} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={status || 'all'}
                            onValueChange={(v) =>
                                setStatus(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="pending">pending</SelectItem>
                                <SelectItem value="approved">
                                    approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                    rejected
                                </SelectItem>
                                <SelectItem value="done">done</SelectItem>
                            </SelectContent>
                        </Select>

                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="request"
                            disabled={selectedIds.length === 0}
                            onConfirm={handleBulkDelete}
                        />
                    </div>
                </div>

                {/* Table */}
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
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Siswa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Konsultan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Topik
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Dibuat
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        Tidak ada data.
                                    </td>
                                </tr>
                            ) : (
                                data.map((r) => {
                                    const isSelected = selectedIds.includes(
                                        r.id,
                                    );

                                    return (
                                        <tr
                                            key={r.id}
                                            className={`transition-colors hover:bg-accent ${
                                                isSelected ? 'bg-accent' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            r.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2">
                                                #{r.id}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="font-medium">
                                                    {r.student?.name ?? '-'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {r.student?.email ?? ''}
                                                </div>
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="font-medium">
                                                    {r.consultant?.name ?? '-'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {r.consultant?.email ?? ''}
                                                </div>
                                            </td>

                                            <td className="px-6 py-2 font-medium">
                                                {r.topic}
                                            </td>

                                            <td className="px-6 py-2">
                                                <Badge
                                                    variant={statusVariant(
                                                        r.status,
                                                    )}
                                                >
                                                    {r.status}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-2 text-muted-foreground">
                                                {formatDateTime(r.created_at)}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`${baseUrl}/${r.id}`}
                                                        >
                                                            Detail
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={`${baseUrl}/${r.id}/print`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Print
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer nav */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {requests.total} baris
                        dipilih.
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
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {requests.current_page > 1 ? (
                                        <Link
                                            href={makeQuery({
                                                page: requests.current_page - 1,
                                                perPage: rowsPerPage,
                                                search,
                                                status,
                                            })}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {Array.from(
                                    { length: requests.last_page },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={makeQuery({
                                                page,
                                                perPage: rowsPerPage,
                                                search,
                                                status,
                                            })}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    requests.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {requests.current_page <
                                    requests.last_page ? (
                                        <Link
                                            href={makeQuery({
                                                page: requests.current_page + 1,
                                                perPage: rowsPerPage,
                                                search,
                                                status,
                                            })}
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
