import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Search } from 'lucide-react';
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

import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
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
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { User } from '@/types/user';

type RoleFilter = 'all' | 'admin' | 'instructor' | 'student';

// 👇 Simple, explicit page props type
type UsersPageProps = {
    users: Paginated<User>;
};

const baseUrl = '/admin/users';

export default function UserIndex() {
    // 👇 Tell Inertia what props shape we expect
    const { users } = usePage<UsersPageProps>().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            // select all currently filtered users
            setSelectedIds(filteredUsers.map((u) => u.id));
        } else {
            // remove only IDs that are in the current filtered list
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

        if (
            !window.confirm(
                `Yakin ingin menghapus ${selectedIds.length} pengguna terpilih?`,
            )
        ) {
            return;
        }

        router.post(
            `${baseUrl}/bulk-delete`,
            {
                ids: selectedIds,
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                },
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
                        <Button>Tambah User Baru</Button>
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
                                <SelectItem value="instructor">Guru</SelectItem>
                                <SelectItem value="student">Siswa</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="destructive"
                            disabled={selectedIds.length === 0}
                            onClick={handleBulkDelete}
                        >
                            Hapus Terpilih ({selectedIds.length})
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) =>
                                            handleToggleSelectAll(
                                                e.target.checked,
                                            )
                                        }
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
                                            className="transition-colors hover:bg-foreground/10"
                                        >
                                            <td className="w-10 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) =>
                                                        handleToggleSelectOne(
                                                            user.id,
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-3">
                                                {user.name}
                                            </td>

                                            <td className="px-6 py-3">
                                                {user.email}
                                            </td>

                                            <td className="px-6 py-3">
                                                <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3">
                                                {new Date(
                                                    user.created_at,
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-3">
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

                <div className="flex justify-center py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                {users.current_page > 1 ? (
                                    <Link
                                        href={`${baseUrl}?page=${
                                            users.current_page - 1
                                        }`}
                                    >
                                        <PaginationPrevious />
                                    </Link>
                                ) : (
                                    <PaginationPrevious className="pointer-events-none opacity-50" />
                                )}
                            </PaginationItem>

                            {Array.from(
                                { length: users.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <PaginationItem key={page}>
                                    <Link href={`${baseUrl}?page=${page}`}>
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
