import { Head, Link, usePage } from '@inertiajs/react';
import { Edit2 } from 'lucide-react';

import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
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

    // Use data directly from Inertia props
    const data = universities.data ?? [];

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
                        <Link href={`${baseUrl}/create`}>
                            <Button>Tambah Universitas</Button>
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
                                    <Link href={`${baseUrl}/create`}>
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
                                                {/* Name */}
                                                <TableCell className="font-medium">
                                                    {u.name}
                                                </TableCell>

                                                {/* Code (improved display) */}
                                                <TableCell>
                                                    {u.code ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="font-mono uppercase"
                                                        >
                                                            {u.code}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Tidak ada kode
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* City */}
                                                <TableCell>
                                                    {u.city || (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Majors */}
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

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {/* Edit as icon button */}
                                                        <Link
                                                            href={`${baseUrl}/${u.id}/edit`}
                                                        >
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="hover:bg-foreground/10"
                                                                aria-label="Edit universitas"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        {/* Delete with dialog */}
                                                        <ConfirmDeleteButton
                                                            deleteUrl={`${baseUrl}/${u.id}`}
                                                            resourceLabel="universitas"
                                                            itemName={u.name}
                                                        />
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
