import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Edit2, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

/* User Type (removed university + major) */
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'instructor' | 'student' | string;
    created_at: string;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

type RoleFilter = 'all' | 'admin' | 'instructor' | 'student';

export default function UserIndex() {
    const { users } = usePage<{ users: PaginatedUsers }>().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

    const filteredUsers = users.data.filter((user) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q);

        const matchesRole =
            roleFilter === 'all' ? true : user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`${baseUrl}/${userId}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Users Management',
            href: '/',
        },
    ];

    const baseUrl = '/admin/users';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen User" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen User</h1>
                        <p>Mengelola pengguna sistem dan izin mereka</p>
                    </div>

                    <Link
                        href={`${baseUrl}/create`}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700"
                    >
                        Tambah User Baru
                    </Link>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                    <div className="borderpx-3 flex flex-1 items-center gap-2 rounded-lg py-2">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Filter</span>
                        <select
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(e.target.value as RoleFilter)
                            }
                            className="rounded-lg border bg-accent px-3 py-2 text-sm shadow-sm outline-none"
                        >
                            <option value="all">Semua</option>
                            <option value="admin">Admin</option>
                            <option value="instructor">Guru</option>
                            <option value="student">Siswa</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr>
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
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition-colors"
                                    >
                                        <td className="px-6 py-3">
                                            {user.name}
                                        </td>

                                        <td className="px-6 py-3">
                                            {user.email}
                                        </td>

                                        <td className="px-6 py-3">
                                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
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
                                                    className="hover rounded-md p-2"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(user.id)
                                                    }
                                                    className="rounded-md p-2 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
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
                                        Tidak ada pengguna ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-slate-200p-4 flex items-center justify-between rounded-lg border text-sm shadow-sm">
                    <div>
                        Menampilkan{' '}
                        <span className="font-medium">{users.from}</span> hingga{' '}
                        <span className="font-medium">{users.to}</span> dari{' '}
                        <span className="font-medium">{users.total}</span>{' '}
                        pengguna
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Prev */}
                        {users.current_page > 1 ? (
                            <Link
                                href={`${baseUrl}?page=${
                                    users.current_page - 1
                                }`}
                                className="inline-flex items-center rounded-md border border-slate-300 p-2 hover:bg-slate-50"
                            >
                                <ChevronLeft size={18} />
                            </Link>
                        ) : (
                            <span className="inline-flex items-center rounded-md border border-slate-200 p-2 text-slate-300">
                                <ChevronLeft size={18} />
                            </span>
                        )}

                        {/* Pages */}
                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: users.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Link
                                    key={page}
                                    href={`${baseUrl}?page=${page}`}
                                    className={`inline-flex items-center rounded-md px-3 py-1 ${
                                        page === users.current_page
                                            ? 'bg-primary/90 text-white'
                                            : 'border border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>

                        {/* Next */}
                        {users.current_page < users.last_page ? (
                            <Link
                                href={`${baseUrl}?page=${
                                    users.current_page + 1
                                }`}
                                className="inline-flex items-center rounded-md border border-slate-300 p-2 hover:bg-slate-50"
                            >
                                <ChevronRight size={18} />
                            </Link>
                        ) : (
                            <span className="inline-flex items-center rounded-md border border-slate-200 p-2 text-slate-300">
                                <ChevronRight size={18} />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
