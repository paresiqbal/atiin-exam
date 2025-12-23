import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';

type NewsRow = {
    id: number;
    title: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
};

interface Props extends InertiaPageProps {
    news: Paginated<NewsRow>;
    filters?: { search?: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Berita', href: '/admin/news' },
];

export default function NewsIndex() {
    const { news, filters } = usePage<Props>().props;
    const data = useMemo(() => news.data ?? [], [news.data]);
    const [search, setSearch] = useState(filters?.search ?? '');

    const applySearch = () => {
        router.get(
            '/admin/news',
            { search: search || undefined, page: 1 },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus berita ini?')) return;
        router.delete(`/admin/news/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Berita</h1>
                        <p className="text-muted-foreground">
                            Buat pengumuman sederhana untuk siswa.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/admin/news/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Berita
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <InputGroup className="max-w-xl">
                        <InputGroupAddon>
                            <Search className="h-4 w-4 text-slate-500" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Cari judul..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applySearch();
                            }}
                        />
                        <InputGroupAddon align="inline-end">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={applySearch}
                            >
                                Cari
                            </Button>
                        </InputGroupAddon>
                    </InputGroup>
                </div>

                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-accent">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Judul
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Publish
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Belum ada berita.
                                    </td>
                                </tr>
                            ) : (
                                data.map((n) => (
                                    <tr
                                        key={n.id}
                                        className="transition-colors hover:bg-accent"
                                    >
                                        <td className="px-6 py-3 font-medium">
                                            {n.title}
                                        </td>
                                        <td className="px-6 py-3">
                                            {n.status === 'published' ? (
                                                <Badge>Published</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Draft
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-muted-foreground">
                                            {n.published_at ?? '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    asChild
                                                    aria-label="Edit"
                                                >
                                                    <Link
                                                        href={`/admin/news/${n.id}/edit`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    aria-label="Hapus"
                                                    onClick={() =>
                                                        handleDelete(n.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="text-sm text-muted-foreground">
                    Menampilkan {data.length} item (halaman ini).
                </div>
            </div>
        </AppLayout>
    );
}
