// resources/js/pages/admin/universities/UnivIndex.tsx

import { Head, Link, usePage } from '@inertiajs/react';
import { Edit2, Eye, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

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
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';

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
    const data = useMemo(() => universities.data ?? [], [universities.data]);
    const [searchQuery, setSearchQuery] = useState('');

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
                            <Button>Tambah Universitas</Button>
                        </Link>
                    </div>
                </div>

                {/* 🔍 Search bar */}
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

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Universitas</CardTitle>
                        <CardDescription>
                            Daftar lengkap universitas beserta program studi
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {filteredUniversities.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">
                                Tidak ada universitas ditemukan
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
                                        {filteredUniversities.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">
                                                    {u.name}
                                                </TableCell>

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

                                                <TableCell>
                                                    {u.city || (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>

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
