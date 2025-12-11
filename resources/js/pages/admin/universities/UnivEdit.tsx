import { Head, useForm } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import type { BreadcrumbItem } from '@/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface University {
    id: number;
    name: string;
    code?: string | null;
    city?: string | null;
    description?: string | null;
    website?: string | null;
}

interface UnivEditPageProps extends InertiaPageProps {
    university: University;
}

const baseUrl = '/admin/universities';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Universitas', href: baseUrl },
    { title: 'Edit Universitas', href: '#' },
];

export default function UnivEdit({ university }: UnivEditPageProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: university.name ?? '',
        code: university.code ?? '',
        city: university.city ?? '',
        description: university.description ?? '',
        website: university.website ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`${baseUrl}/${university.id}`);
    };

    const handleCancel = () => {
        window.location.href = baseUrl;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Universitas" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Universitas</h1>
                        <p className="text-muted-foreground">
                            Perbarui informasi universitas dan detail terkait
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Formulir Universitas</CardTitle>
                        <CardDescription>
                            Sesuaikan data universitas sesuai kebutuhan.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Universitas
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Universitas Indonesia"
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Code & City */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData('code', e.target.value)
                                        }
                                        placeholder="Contoh: UI, ITB, UGM"
                                        className={
                                            errors.code
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-500">
                                            {errors.code}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">Kota</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) =>
                                            setData('city', e.target.value)
                                        }
                                        placeholder="Contoh: Jakarta, Bandung"
                                        className={
                                            errors.city
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.city && (
                                        <p className="text-sm text-red-500">
                                            {errors.city}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={data.website}
                                    onChange={(e) =>
                                        setData('website', e.target.value)
                                    }
                                    placeholder="https://contoh-universitas.ac.id"
                                    className={
                                        errors.website
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {errors.website && (
                                    <p className="text-sm text-red-500">
                                        {errors.website}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={4}
                                    placeholder="Tambahkan deskripsi singkat tentang universitas"
                                    className={
                                        errors.description
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Danger zone: delete university */}
                <Alert className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <AlertDescription>
                            Menghapus universitas akan menghilangkan data
                            universitas ini dari sistem. Pastikan Anda sudah
                            meninjau program studi dan data lain yang terkait
                            sebelum melanjutkan.
                        </AlertDescription>
                    </div>

                    <ConfirmDeleteButton
                        deleteUrl={`${baseUrl}/${university.id}`}
                        resourceLabel="universitas"
                        itemName={university.name}
                    />
                </Alert>
            </div>
        </AppLayout>
    );
}
