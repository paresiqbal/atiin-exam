import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
import { Input } from '@/components/ui/input';

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Edit2, Save, X } from 'lucide-react';

interface Major {
    id: number;
    name: string;
    description?: string | null;
    minimum_passing_grade?: number | null;
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

    // 🔧 Inline edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editGrade, setEditGrade] = useState('');
    const [savingId, setSavingId] = useState<number | null>(null);

    const startEdit = (major: Major) => {
        setEditingId(major.id);
        setEditName(major.name);
        setEditDescription(major.description ?? '');
        setEditGrade(
            major.minimum_passing_grade !== null &&
                major.minimum_passing_grade !== undefined
                ? String(major.minimum_passing_grade)
                : '',
        );
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
        setEditGrade('');
    };

    const saveEdit = (majorId: number) => {
        if (!editName.trim()) return;

        const gradeNumber = Number(editGrade);
        if (Number.isNaN(gradeNumber)) return;

        setSavingId(majorId);

        router.put(
            `/admin/majors/${majorId}`,
            {
                university_id: university.id,
                name: editName.trim(),
                description: editDescription.trim(),
                minimum_passing_grade: gradeNumber,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSavingId(null);
                    setEditingId(null);
                    setEditName('');
                    setEditDescription('');
                    setEditGrade('');
                },
            },
        );
    };

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

                {/* Stats cards */}
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

                {/* Description + Contact */}
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

                {/* Program Studi (NO Card, plain table container) */}
                <div className="rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Program Studi
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Daftar program studi yang terdaftar di
                                universitas ini
                            </p>
                        </div>
                    </div>

                    {majorsData.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">
                            Belum ada program studi untuk universitas ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            Nama Program Studi
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Deskripsi
                                        </th>
                                        <th className="px-4 py-2 text-center">
                                            Nilai Minimal Lulus
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {majorsData.map((major) => {
                                        const isEditing =
                                            editingId === major.id;

                                        return (
                                            <tr
                                                key={major.id}
                                                className="hover:bg-accent/40"
                                            >
                                                {/* Major Name */}
                                                <td className="px-4 py-2 font-medium">
                                                    {isEditing ? (
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) =>
                                                                setEditName(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        major.name
                                                    )}
                                                </td>

                                                {/* Major Description */}
                                                <td className="max-w-md px-4 py-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={
                                                                editDescription
                                                            }
                                                            onChange={(e) =>
                                                                setEditDescription(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {major.description ||
                                                                '-'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Passing Grade */}
                                                <td className="px-4 py-2 text-center">
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={editGrade}
                                                            onChange={(e) =>
                                                                setEditGrade(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="mx-auto h-8 w-24 text-center"
                                                        />
                                                    ) : (
                                                        (major.minimum_passing_grade ??
                                                        '-')
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="hover:bg-foreground/10"
                                                                    onClick={() =>
                                                                        saveEdit(
                                                                            major.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        savingId ===
                                                                        major.id
                                                                    }
                                                                    aria-label="Simpan perubahan"
                                                                >
                                                                    <Save className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="hover:bg-foreground/10"
                                                                    onClick={
                                                                        cancelEdit
                                                                    }
                                                                    aria-label="Batal edit"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="hover:bg-foreground/10"
                                                                    onClick={() =>
                                                                        startEdit(
                                                                            major,
                                                                        )
                                                                    }
                                                                    aria-label={`Edit program studi ${major.name}`}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>

                                                                <ConfirmDeleteButton
                                                                    deleteUrl={`/admin/majors/${major.id}`}
                                                                    resourceLabel="program studi"
                                                                    itemName={
                                                                        major.name
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
