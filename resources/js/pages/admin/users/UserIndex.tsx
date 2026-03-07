import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Badge } from '@/components/ui/badge';
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
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { User } from '@/types/user';

type RoleFilter = 'all' | 'admin' | 'instructor' | 'student';

type UsersPageProps = {
    users: Paginated<User>;
};

const baseUrl = '/admin/users';

export default function UserIndex() {
    const { users } = usePage<UsersPageProps>().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (users as Paginated<User>).per_page ?? 10,
    );

    const filteredUsers = useMemo(
        () =>
            users.data.filter((user: User) => {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                    user.name.toLowerCase().includes(q) ||
                    user.email.toLowerCase().includes(q);

                const matchesRole =
                    roleFilter === 'all' ? true : user.role === roleFilter;

                return matchesSearch && matchesRole;
            }),
        [users, searchQuery, roleFilter],
    );

    const allSelected = useMemo(
        () =>
            filteredUsers.length > 0 &&
            filteredUsers.every((u: User) => selectedIds.includes(u.id)),
        [filteredUsers, selectedIds],
    );

    const someSelected =
        selectedIds.length > 0 && selectedIds.length < filteredUsers.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredUsers.map((u) => u.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter(
                    (id) => !filteredUsers.some((user) => user.id === id),
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

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Manajemen Pengguna',
            href: '/admin/users',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen User" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manajemen Pengguna
                        </h1>
                        <p className="text-sm">
                            Mengelola pengguna sistem dan izin mereka
                        </p>
                    </div>

                    <Link href={`${baseUrl}/create`}>
                        <Button>
                            Tambah User Baru
                            <Plus />
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredUsers.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={roleFilter}
                            onValueChange={(value) =>
                                setRoleFilter(value as RoleFilter)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Semua peran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Guru</SelectItem>
                                <SelectItem value="student">Siswa</SelectItem>
                            </SelectContent>
                        </Select>

                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="pengguna"
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
                                    Nama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Peran
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Bergabung
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user: User) => {
                                    const isSelected = selectedIds.includes(
                                        user.id,
                                    );

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`transition-colors hover:bg-accent ${isSelected ? 'bg-accent' : ''} `}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            user.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2">
                                                {user.name}
                                            </td>

                                            <td className="px-6 py-2">
                                                {user.email}
                                            </td>

                                            <td className="px-6 py-2">
                                                <Badge variant="outline">
                                                    {user.role}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-2">
                                                {new Date(
                                                    user.created_at,
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`${baseUrl}/${user.id}/edit`}
                                                        className="rounded-md p-2 hover:bg-foreground/20"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${user.id}`}
                                                        resourceLabel="pengguna"
                                                        itemName={user.name}
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
                                        Tidak ada pengguna ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {users.total} baris dipilih.
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

                        {/* Pagination */}
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    {users.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                users.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    users.current_page,
                                    users.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page === users.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {users.current_page < users.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                users.current_page + 1
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
