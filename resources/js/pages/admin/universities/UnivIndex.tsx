import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Eye, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import ActionIconTooltip from '@/components/ActionIconTooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
import { getPaginationRange } from '@/lib/pagination';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Checkbox } from '@/components/ui/checkbox';

import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface Major {
    id: number;
    name: string;
}

interface University {
    id: number;
    name: string;
    code?: string | null;
    city?: string | null;
    majors: Major[];
}

interface UnivPageProps extends InertiaPageProps {
    universities: Paginated<University>;
    total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Universitas', href: '/admin/universities' },
];

const baseUrl = '/admin/universities';

export default function UnivIndex() {
    const { universities } = usePage<UnivPageProps>().props;
    const data = useMemo(() => universities.data ?? [], [universities.data]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (universities as Paginated<University>).per_page ?? 10,
    );

    const filteredUniversities = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return data.filter((u) => {
            return (
                u.name.toLowerCase().includes(q) ||
                (u.code ?? '').toLowerCase().includes(q) ||
                (u.city ?? '').toLowerCase().includes(q) ||
                u.majors.some((m) => m.name.toLowerCase().includes(q))
            );
        });
    }, [data, searchQuery]);

    const totalMajors = filteredUniversities.reduce(
        (sum, u) => sum + u.majors.length,
        0,
    );

    const avgMajors =
        filteredUniversities.length > 0
            ? (totalMajors / filteredUniversities.length).toFixed(1)
            : '0';

    // Selection logic
    const allSelected =
        filteredUniversities.length > 0 &&
        filteredUniversities.every((u) => selectedIds.includes(u.id));

    const someSelected =
        selectedIds.length > 0 &&
        selectedIds.length < filteredUniversities.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredUniversities.map((u) => u.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter(
                    (id) => !filteredUniversities.some((u) => u.id === id),
                ),
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Universitas" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Daftar Universitas
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola daftar universitas dan program studi
                        </p>
                    </div>

                    <div>
                        <Link href={`${baseUrl}/create`}>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Tambah Universitas
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 🔍 Search + bulk delete */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama universitas, kode, kota, atau prodi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredUniversities.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="universitas"
                            disabled={selectedIds.length === 0}
                            onConfirm={handleBulkDelete}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Universitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {filteredUniversities.length}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Program Studi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalMajors}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Rata-rata Prodi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {avgMajors}
                        </CardContent>
                    </Card>
                </div>

                {/* Table – NO Card wrapper */}
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
                                    Nama Universitas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Kode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Kota
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Program Studi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredUniversities.length > 0 ? (
                                filteredUniversities.map((u) => {
                                    const isSelected = selectedIds.includes(
                                        u.id,
                                    );

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`transition-colors hover:bg-accent ${
                                                isSelected ? 'bg-accent' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            u.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2 font-medium">
                                                {u.name || '-'}
                                            </td>

                                            <td className="px-6 py-2">
                                                {u.code ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-mono uppercase"
                                                    >
                                                        {u.code}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2">
                                                {u.city || (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {u.majors.length > 0 ? (
                                                        <>
                                                            {u.majors
                                                                .slice(0, 3)
                                                                .map((m) => (
                                                                    <Badge
                                                                        key={
                                                                            m.id
                                                                        }
                                                                        variant="outline"
                                                                    >
                                                                        {m.name}
                                                                    </Badge>
                                                                ))}
                                                            {u.majors.length >
                                                                3 && (
                                                                <Badge variant="secondary">
                                                                    +
                                                                    {u.majors
                                                                        .length -
                                                                        3}{' '}
                                                                    lainnya
                                                                </Badge>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <ActionIconTooltip label="Lihat">
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="hover:bg-foreground/10"
                                                        >
                                                            <Link
                                                                href={`${baseUrl}/${u.id}`}
                                                                aria-label={`Lihat detail universitas ${u.name}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </ActionIconTooltip>

                                                    <ActionIconTooltip label="Edit">
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="hover:bg-foreground/10"
                                                        >
                                                            <Link
                                                                href={`${baseUrl}/${u.id}/edit`}
                                                                aria-label={`Edit universitas ${u.name}`}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </ActionIconTooltip>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${u.id}`}
                                                        resourceLabel="universitas"
                                                        itemName={u.name}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        Tidak ada universitas ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: selection info + rows-per-page + pagination */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {universities.total} baris
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
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {universities.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                universities.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    universities.current_page,
                                    universities.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    universities.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {universities.current_page <
                                    universities.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                universities.current_page + 1
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
