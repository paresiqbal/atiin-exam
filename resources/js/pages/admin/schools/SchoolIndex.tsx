import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import ActionIconTooltip from '@/components/ActionIconTooltip';
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
import { getPaginationRange } from '@/lib/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface School {
    id: number;
    name: string;
    description: string | null;
    users_count: number;
    exams_count: number;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PageProps {
    schools: Paginated<School>;
    [key: string]: unknown;
}

const baseUrl = '/admin/schools';

export default function SchoolIndex() {
    const { schools } = usePage<PageProps>().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        schools.per_page ?? 10,
    );

    const filteredSchools = useMemo(
        () =>
            schools.data.filter((school) => {
                const q = searchQuery.toLowerCase();
                const matchesName = school.name.toLowerCase().includes(q);
                const matchesDesc =
                    school.description?.toLowerCase().includes(q) ?? false;

                return matchesName || matchesDesc;
            }),
        [schools.data, searchQuery],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Manajemen Sekolah',
            href: baseUrl,
        },
    ];

    // Selection logic (same pattern as UserIndex / StudentIndex)
    const allSelected =
        filteredSchools.length > 0 &&
        filteredSchools.every((s) => selectedIds.includes(s.id));

    const someSelected =
        selectedIds.length > 0 && selectedIds.length < filteredSchools.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredSchools.map((s) => s.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !filteredSchools.some((s) => s.id === id)),
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
            <Head title="Manajemen Sekolah" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manajemen Sekolah
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola daftar sekolah yang terdaftar di sistem.
                        </p>
                    </div>

                    <Link href={`${baseUrl}/create`}>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Tambah Sekolah
                        </Button>
                    </Link>
                </div>

                {/* Search + bulk delete */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama atau deskripsi sekolah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredSchools.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="sekolah"
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
                                    Nama Sekolah
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Deskripsi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Jumlah Pengguna
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Jumlah Ujian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredSchools.length > 0 ? (
                                filteredSchools.map((school) => {
                                    const isSelected = selectedIds.includes(
                                        school.id,
                                    );

                                    return (
                                        <tr
                                            key={school.id}
                                            className={`transition-colors hover:bg-accent ${
                                                isSelected ? 'bg-accent' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            school.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-3 font-medium">
                                                {school.name || '-'}
                                            </td>

                                            <td className="max-w-md px-6 py-3">
                                                {school.description
                                                    ? school.description
                                                    : '-'}
                                            </td>

                                            <td className="px-6 py-3">
                                                {typeof school.users_count ===
                                                'number'
                                                    ? school.users_count
                                                    : '-'}
                                            </td>

                                            <td className="px-6 py-3">
                                                {typeof school.exams_count ===
                                                'number'
                                                    ? school.exams_count
                                                    : '-'}
                                            </td>

                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    <ActionIconTooltip label="Edit">
                                                        <Link
                                                            href={`${baseUrl}/${school.id}/edit`}
                                                            className="rounded-md p-2 hover:bg-foreground/20"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </ActionIconTooltip>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${school.id}`}
                                                        resourceLabel="sekolah"
                                                        itemName={school.name}
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
                                        -
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: selection info + rows-per-page + pagination */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {schools.total} baris dipilih.
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
                                    {schools.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                schools.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    schools.current_page,
                                    schools.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    schools.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {schools.current_page <
                                    schools.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                schools.current_page + 1
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
