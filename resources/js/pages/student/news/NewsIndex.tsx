'use client';

import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';

type NewsItem = {
    id: number;
    title: string;
    body: string | null;
    published_at: string | null;
    image_url: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
    { title: 'Berita', href: '/student/news' },
];

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function excerpt(text?: string | null, max = 130) {
    const t = (text ?? '').trim();
    if (!t) return '—';
    return t.length > max ? t.slice(0, max) + '…' : t;
}

export default function NewsIndex({ news }: { news: Paginated<NewsItem> }) {
    const items = useMemo(() => news.data ?? [], [news.data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold">Berita</h1>
                    <p className="text-sm text-muted-foreground">
                        Pengumuman terbaru dari admin.
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                        Belum ada berita.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {items.map((n) => (
                            <Link
                                key={n.id}
                                href={`/student/news/${n.id}`}
                                className="block"
                            >
                                <Card className="overflow-hidden transition hover:shadow-sm">
                                    {n.image_url ? (
                                        <img
                                            src={n.image_url}
                                            alt={n.title}
                                            className="h-40 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-40 w-full bg-muted" />
                                    )}

                                    <div className="space-y-2 p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline">
                                                {formatDate(n.published_at)}
                                            </Badge>
                                        </div>

                                        <h2 className="line-clamp-2 text-base font-semibold">
                                            {n.title}
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            {excerpt(n.body)}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
