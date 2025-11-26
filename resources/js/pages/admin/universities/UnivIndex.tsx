import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface Major {
    id: number;
    name: string;
}

interface University {
    id: number;
    name: string;
    code: string;
    city: string;
    majors: Major[];
}

interface Paginated<T> {
    data: T[];
}

interface UnivPageProps extends InertiaPageProps {
    universities: Paginated<University>;
    total: number;
}

const breadcrumbs = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Universitas', href: '/admin/universities' },
];

export default function UnivIndex() {
    const { universities } = usePage<UnivPageProps>().props;

    const [data, setData] = useState<University[]>(universities.data ?? []);

    const handleDelete = (id: number) => {
        if (!confirm('Hapus universitas ini?')) return;

        router.delete(`/admin/universities/${id}`, {
            onSuccess: () => {
                setData((prev) => prev.filter((u) => u.id !== id));
            },
            onError: () => alert('Gagal menghapus universitas'),
        });
    };

    const totalMajors = data.reduce((sum, u) => sum + u.majors.length, 0);

    const avgMajors =
        data.length > 0 ? (totalMajors / data.length).toFixed(1) : '0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Universitas" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Daftar Universitas
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola daftar universitas dan program studi
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/admin/universities/create">
                            <Button>Tambah Universitas</Button>
                        </Link>
                        <Link href="/admin/universities/import">
                            <Button variant="outline">Import CSV</Button>
                        </Link>
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
                            {data.length}
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

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Universitas</CardTitle>
                        <CardDescription>
                            Daftar lengkap universitas beserta program studi
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {data.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">
                                Belum ada universitas
                                <div className="mt-4">
                                    <Link href="/admin/universities/create">
                                        <Button>
                                            Tambah Universitas Pertama
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Nama Universitas
                                            </TableHead>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Kota</TableHead>
                                            <TableHead>Program Studi</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">
                                                    {u.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {u.code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{u.city}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.majors.length > 0 ? (
                                                            u.majors.map(
                                                                (m) => (
                                                                    <Badge
                                                                        key={
                                                                            m.id
                                                                        }
                                                                        variant="outline"
                                                                    >
                                                                        {m.name}
                                                                    </Badge>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                -
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/admin/universities/${u.id}/edit`}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    u.id,
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
