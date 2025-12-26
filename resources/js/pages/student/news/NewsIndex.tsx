import { Head, Link } from '@inertiajs/react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';

type NewsItem = {
    id: number;
    title: string;
    excerpt: string | null;
    published_at: string | null;
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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getRelativeTime(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    return null;
}

export default function NewsIndex({ news }: { news: Paginated<NewsItem> }) {
    const items = useMemo(() => news.data ?? [], [news.data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita" />

            <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Berita & Pengumuman
                    </h1>
                    <p className="text-muted-foreground">
                        Informasi terbaru dan pengumuman penting dari admin
                    </p>
                </div>

                {/* List */}
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
                        <div className="mb-4 rounded-full bg-muted p-3">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Belum ada berita tersedia
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pengumuman baru akan muncul di sini
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((n) => {
                            const relativeTime = getRelativeTime(
                                n.published_at,
                            );

                            return (
                                <Link
                                    key={n.id}
                                    href={`/student/news/${n.id}`}
                                    className="group block"
                                >
                                    <div className="relative rounded-lg border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md md:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1 space-y-2">
                                                {/* Date */}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>
                                                        {formatDate(
                                                            n.published_at,
                                                        )}
                                                    </span>
                                                    {relativeTime && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-medium text-foreground">
                                                                {relativeTime}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h2 className="text-lg leading-tight font-semibold transition-colors group-hover:text-primary md:text-xl">
                                                    {n.title}
                                                </h2>

                                                {/* Excerpt */}
                                                {n.excerpt && (
                                                    <p className="line-clamp-2 text-sm text-muted-foreground md:text-base">
                                                        {n.excerpt}
                                                    </p>
                                                )}

                                                {/* Read more */}
                                                <div className="flex items-center gap-1 pt-1 text-sm font-medium text-primary">
                                                    <span>
                                                        Baca selengkapnya
                                                    </span>
                                                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
