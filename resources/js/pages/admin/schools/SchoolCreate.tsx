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

interface SchoolFormData {
    name: string;
    description: string;
}

const baseUrl = '/admin/schools';

export default function SchoolCreate() {
    const { data, setData, post, processing, errors } = useForm<SchoolFormData>(
        {
            name: '',
            description: '',
        },
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(baseUrl);
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
            title: 'Tambah Sekolah',
            href: `${baseUrl}/create`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Sekolah" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Tambah Sekolah</h1>
                    <p className="text-sm text-muted-foreground">
                        Tambahkan sekolah baru ke dalam sistem.
                    </p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Data Sekolah</CardTitle>
                        <CardDescription>
                            Isi informasi dasar sekolah.
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
                                    placeholder="Contoh: SMA Negeri 1 Jakarta"
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
                                    placeholder="Keterangan singkat mengenai sekolah..."
                                    className={
                                        errors.description
                                            ? 'border-destructive'
                                            : ''
                                    }
                                    rows={4}
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
                                        : 'Simpan Sekolah'}
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
