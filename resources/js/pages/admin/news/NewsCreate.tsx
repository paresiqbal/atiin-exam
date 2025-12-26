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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Daftar Berita', href: '/admin/news' },
    { title: 'Buat Berita', href: '/admin/news/create' },
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
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Berita" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Buat Berita</h1>
                    <p className="text-sm text-muted-foreground">
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

                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Membuat Berita...'
                                    : 'Buat Berita'}
                            </Button>
                            <Button variant="ghost" className="flex-1" asChild>
                                <Link href="/admin/news">Kembali</Link>
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
