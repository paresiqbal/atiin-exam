import { Head, useForm } from '@inertiajs/react';

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
import AppLayout from '@/layouts/app-layout';

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface School {
    id: number;
    name: string;
    description: string | null;
}

interface EditProps {
    school: School;
}

const baseUrl = '/admin/schools';

export default function SchoolEdit({ school }: EditProps) {
    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        description: string;
    }>({
        name: school.name ?? '',
        description: school.description ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`${baseUrl}/${school.id}`);
    };

    const handleCancel = () => {
        window.location.href = baseUrl;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Manajemen Sekolah',
            href: baseUrl,
        },
        {
            title: `Edit: ${school.name}`,
            href: `${baseUrl}/${school.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Sekolah - ${school.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        Edit Sekolah – {school.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui informasi sekolah.
                    </p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Data Sekolah</CardTitle>
                        <CardDescription>
                            Ubah informasi dasar sekolah.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Sekolah{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Deskripsi (opsional)
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={4}
                                    className={
                                        errors.description
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Perubahan'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
