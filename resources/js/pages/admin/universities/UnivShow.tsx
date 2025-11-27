// resources/js/pages/admin/universities/UnivShow.tsx

import { Head, Link, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';

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

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface Major {
    id: number;
    name: string;
    // extend later if you add more fields
}

interface University {
    id: number;
    name: string;
    code?: string | null;
    city?: string | null;
    description?: string | null;
    website?: string | null;
    majors_count?: number;
}

interface UnivShowPageProps extends InertiaPageProps {
    university: University;
    majors: Paginated<Major>;
}

const baseUrl = '/admin/universities';

export default function UnivShow() {
    const { university, majors } = usePage<UnivShowPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Universitas', href: baseUrl },
        { title: university.name, href: '#' },
    ];

    const majorsData = majors.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={university.name} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {university.name}
                        </h1>

                        <p className="text-muted-foreground">
                            Detail universitas dan daftar program studi
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={`${baseUrl}/${university.id}/edit`}>
                                Edit Universitas
                            </Link>
                        </Button>

                        <Button asChild variant="ghost">
                            <Link href={baseUrl}>Kembali ke Daftar</Link>
                        </Button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Kode Universitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xl font-semibold">
                            {university.code ? (
                                <Badge
                                    variant="secondary"
                                    className="font-mono uppercase"
                                >
                                    {university.code}
                                </Badge>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    Tidak ada kode
                                </span>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Kota
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xl font-semibold">
                            {university.city || (
                                <span className="text-sm text-muted-foreground">
                                    -
                                </span>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Jumlah Program Studi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {university.majors_count ?? majorsData.length}
                        </CardContent>
                    </Card>
                </div>

                {/* Detail + Website */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Deskripsi</CardTitle>
                            <CardDescription>
                                Informasi tambahan mengenai universitas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {university.description ? (
                                <p className="text-sm leading-relaxed">
                                    {university.description}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada deskripsi untuk universitas ini.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Kontak</CardTitle>
                            <CardDescription>
                                Website resmi universitas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Website
                                </p>
                                {university.website ? (
                                    <a
                                        href={university.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium underline underline-offset-2"
                                    >
                                        {university.website}
                                    </a>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada website
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Majors list */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Program Studi</CardTitle>
                            <CardDescription>
                                Daftar program studi yang terdaftar di
                                universitas ini
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {majorsData.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">
                                Belum ada program studi untuk universitas ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2">
                                                Nama Program Studi
                                            </th>
                                            <th className="px-4 py-2 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {majorsData.map((major) => (
                                            <tr
                                                key={major.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-4 py-2">
                                                    {major.name}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="ghost"
                                                        >
                                                            <Link
                                                                href={`/admin/majors/${major.id}/edit`}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>

                                                        <ConfirmDeleteButton
                                                            deleteUrl={`/admin/majors/${major.id}`}
                                                            resourceLabel="program studi"
                                                            itemName={
                                                                major.name
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
