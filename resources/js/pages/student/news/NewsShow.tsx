'use client';

import { Head, Link } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type NewsItem = {
    id: number;
    title: string;
    body: string | null;
    published_at: string | null;
    image_url: string | null;
};

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

export default function NewsShow({ newsItem }: { newsItem: NewsItem }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/student/dashboard' },
        { title: 'Berita', href: '/student/news' },
        { title: `#${newsItem.id}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={newsItem.title} />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">{newsItem.title}</h1>
                        <div className="mt-2">
                            <Badge variant="outline">
                                {formatDate(newsItem.published_at)}
                            </Badge>
                        </div>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/student/news">Kembali</Link>
                    </Button>
                </div>

                {newsItem.image_url ? (
                    <div className="overflow-hidden rounded-lg border">
                        <img
                            src={newsItem.image_url}
                            alt={newsItem.title}
                            className="max-h-[360px] w-full object-cover"
                        />
                    </div>
                ) : null}

                <div className="rounded-lg border p-4 md:p-6">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {newsItem.body?.trim() ? newsItem.body : '—'}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
