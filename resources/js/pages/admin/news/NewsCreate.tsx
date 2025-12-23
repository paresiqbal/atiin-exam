'use client';

import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Berita', href: '/admin/news' },
    { title: 'Buat', href: '/admin/news/create' },
];

export default function NewsCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        body: string;
        status: 'draft' | 'published';
        image: File | null;
    }>({
        title: '',
        body: '',
        status: 'draft',
        image: null,
    });

    const previewUrl = useMemo(() => {
        if (!data.image) return null;
        return URL.createObjectURL(data.image);
    }, [data.image]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/news', {
            forceFormData: true, // penting untuk upload file
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Berita" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Buat Berita</h1>
                    <p className="text-muted-foreground">
                        Berita sederhana dengan 1 gambar.
                    </p>
                </div>

                <Card className="p-4 md:p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Judul</Label>
                            <Input
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                placeholder="Judul berita..."
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Konten (opsional)</Label>
                            <Textarea
                                rows={6}
                                value={data.body}
                                onChange={(e) =>
                                    setData('body', e.target.value)
                                }
                                placeholder="Tulis isi berita..."
                            />
                            {errors.body && (
                                <p className="text-sm text-destructive">
                                    {errors.body}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) =>
                                    setData(
                                        'status',
                                        v as 'draft' | 'published',
                                    )
                                }
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">
                                        Published
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-destructive">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Gambar (opsional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setData(
                                        'image',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {errors.image && (
                                <p className="text-sm text-destructive">
                                    {errors.image}
                                </p>
                            )}

                            {previewUrl && (
                                <div className="mt-3 overflow-hidden rounded-lg border">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-56 w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <Button variant="ghost" asChild>
                                <Link href="/admin/news">Kembali</Link>
                            </Button>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
