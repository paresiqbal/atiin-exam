'use client';

import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

type NewsItem = {
    id: number;
    title: string;
    body: string | null;
    status: 'draft' | 'published';
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Berita', href: '/admin/news' },
    { title: 'Edit', href: '#' },
];

export default function NewsEdit({
    newsItem,
    imageUrl,
}: {
    newsItem: NewsItem;
    imageUrl: string | null;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        body: string;
        status: 'draft' | 'published';
        image: File | null;
        remove_image: boolean;
        _method: 'put';
    }>({
        title: newsItem.title,
        body: newsItem.body ?? '',
        status: newsItem.status,
        image: null,
        remove_image: false,
        _method: 'put',
    });

    const previewUrl = useMemo(() => {
        if (!data.image) return null;
        return URL.createObjectURL(data.image);
    }, [data.image]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/news/${newsItem.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const showImage = previewUrl || (data.remove_image ? null : imageUrl);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Berita" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Edit Berita</h1>
                    <p className="text-muted-foreground">
                        Perbarui judul, konten, dan gambar.
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
                            />
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
                        </div>

                        <div className="space-y-2">
                            <Label>Ganti Gambar (opsional)</Label>
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

                            {imageUrl && (
                                <div className="flex items-center gap-2 pt-2">
                                    <Checkbox
                                        checked={data.remove_image}
                                        onCheckedChange={(v) =>
                                            setData('remove_image', Boolean(v))
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        Hapus gambar saat ini
                                    </span>
                                </div>
                            )}

                            {showImage && (
                                <div className="mt-3 overflow-hidden rounded-lg border">
                                    <img
                                        src={showImage}
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
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
