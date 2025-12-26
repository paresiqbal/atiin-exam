'use client';

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

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

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

type NewsRow = {
    id: number;
    title: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
};

type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

interface Props extends InertiaPageProps {
    news: Paginated<NewsRow>;
    filters?: { search?: string | null };
}

const baseUrl = '/admin/news';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Berita', href: '/admin/news' },
];

function formatDateTime(value: string | null) {
    if (!value) return '-';
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

function makeQuery({
    page,
    perPage,
    search,
}: {
    page: number;
    perPage: number;
    search: string;
}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (search.trim() !== '') params.set('search', search.trim());
    return `${baseUrl}?${params.toString()}`;
}

export default function NewsIndex() {
    const { news, filters } = usePage<Props>().props;

    const pageItems = useMemo(() => news.data ?? [], [news.data]);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(news.per_page ?? 10);

    // LIVE SEARCH (debounced) so it behaves like UserIndex
    const firstRun = useRef(true);
    useEffect(() => {
        // prevent double request on mount
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const t = setTimeout(() => {
            router.get(
                baseUrl,
                {
                    search: search.trim() || undefined,
                    page: 1,
                    per_page: rowsPerPage,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true, // don't spam browser history while typing
                },
            );
        }, 350);

        return () => clearTimeout(t);
    }, [search, rowsPerPage]);

    const allSelected = useMemo(
        () =>
            pageItems.length > 0 &&
            pageItems.every((n) => selectedIds.includes(n.id)),
        [pageItems, selectedIds],
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
                const merged = new Set([
                    ...prev,
                    ...pageItems.map((n) => n.id),
                ]);
                return Array.from(merged);
            });
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !pageItems.some((n) => n.id === id)),
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
        const perPage = Number(value) || 10;
        setRowsPerPage(perPage);

        // keep search
        router.get(
            baseUrl,
            { page: 1, per_page: perPage, search: search.trim() || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Berita</h1>
                        <p className="text-sm text-muted-foreground">
                            Buat pengumuman sederhana untuk siswa.
                        </p>
                    </div>

                    <Link href={`${baseUrl}/create`}>
                        <Button>
                            Buat Berita
                            <Plus className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Search + Bulk */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari judul..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {search !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {news.total} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="berita"
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
                                    Judul
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Status
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Publish
                                </th>

                                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {pageItems.length > 0 ? (
                                pageItems.map((n) => {
                                    const isSelected = selectedIds.includes(
                                        n.id,
                                    );

                                    return (
                                        <tr
                                            key={n.id}
                                            className={`transition-colors hover:bg-accent ${
                                                isSelected ? 'bg-accent' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            n.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2 font-medium">
                                                {n.title}
                                            </td>

                                            <td className="px-6 py-2">
                                                {n.status === 'published' ? (
                                                    <Badge>Published</Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="px-6 py-2 text-muted-foreground">
                                                {formatDateTime(n.published_at)}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`${baseUrl}/${n.id}/edit`}
                                                        className="rounded-md p-2 hover:bg-foreground/20"
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${n.id}`}
                                                        resourceLabel="berita"
                                                        itemName={n.title}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        Belum ada berita.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer nav */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {news.total} baris dipilih.
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
                                    {news.current_page > 1 ? (
                                        <Link
                                            href={makeQuery({
                                                page: news.current_page - 1,
                                                perPage: rowsPerPage,
                                                search,
                                            })}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {Array.from(
                                    { length: news.last_page },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={makeQuery({
                                                page,
                                                perPage: rowsPerPage,
                                                search,
                                            })}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page === news.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {news.current_page < news.last_page ? (
                                        <Link
                                            href={makeQuery({
                                                page: news.current_page + 1,
                                                perPage: rowsPerPage,
                                                search,
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
