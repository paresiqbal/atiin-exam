import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
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

    const handleDelete = (id: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin menghapus sekolah ini? Data terkait mungkin terpengaruh.',
            )
        ) {
            router.delete(`${baseUrl}/${id}`);
        }
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Sekolah" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
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

                {/* Filters / Search */}
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1">
                        <InputGroup className="w-full">
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
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-slate-50/60">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Nama Sekolah
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Deskripsi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Jumlah Pengguna
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Jumlah Ujian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredSchools.length > 0 ? (
                                filteredSchools.map((school) => (
                                    <tr
                                        key={school.id}
                                        className="transition-colors hover:bg-slate-50/60"
                                    >
                                        <td className="px-6 py-3 font-medium">
                                            {school.name}
                                        </td>

                                        <td className="max-w-md px-6 py-3 text-slate-700">
                                            {school.description
                                                ? school.description
                                                : '-'}
                                        </td>

                                        <td className="px-6 py-3">
                                            {school.users_count}
                                        </td>

                                        <td className="px-6 py-3">
                                            {school.exams_count}
                                        </td>

                                        <td className="px-6 py-3">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`${baseUrl}/${school.id}/edit`}
                                                    className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(school.id)
                                                    }
                                                    className="rounded-md p-2 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        Tidak ada sekolah ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (shadcn + Inertia) */}
                <div className="flex justify-center py-4">
                    <Pagination>
                        <PaginationContent>
                            {/* Previous */}
                            <PaginationItem>
                                {schools.current_page > 1 ? (
                                    <Link
                                        href={`${baseUrl}?page=${
                                            schools.current_page - 1
                                        }`}
                                    >
                                        <PaginationPrevious />
                                    </Link>
                                ) : (
                                    <PaginationPrevious className="pointer-events-none opacity-50" />
                                )}
                            </PaginationItem>

                            {/* Page numbers */}
                            {Array.from(
                                { length: schools.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <PaginationItem key={page}>
                                    <Link href={`${baseUrl}?page=${page}`}>
                                        <PaginationLink
                                            isActive={
                                                page === schools.current_page
                                            }
                                        >
                                            {page}
                                        </PaginationLink>
                                    </Link>
                                </PaginationItem>
                            ))}

                            {/* Next */}
                            <PaginationItem>
                                {schools.current_page < schools.last_page ? (
                                    <Link
                                        href={`${baseUrl}?page=${
                                            schools.current_page + 1
                                        }`}
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
        </AppLayout>
    );
}
