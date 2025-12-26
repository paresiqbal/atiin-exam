import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

type NewsShowItem = {
    id: number;
    title: string;
    body_html: string | null;
    published_at: string | null;
    image_url: string | null;
};

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
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

export default function NewsShow({ newsItem }: { newsItem: NewsShowItem }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/student/dashboard' },
        { title: 'Berita', href: '/student/news' },
        { title: 'Detail', href: `/student/news/${newsItem.id}` },
    ];

    const relativeTime = getRelativeTime(newsItem.published_at);
    const time = formatTime(newsItem.published_at);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={newsItem.title} />

            <article className="mx-auto max-w-4xl space-y-8 p-4 py-8 md:p-8 md:py-12">
                {/* Back button */}
                <Link
                    href="/student/news"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Berita</span>
                </Link>

                {/* Header section */}
                <header className="space-y-4">
                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(newsItem.published_at)}</span>
                        </div>

                        {time && (
                            <>
                                <span className="text-muted-foreground/50">
                                    •
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{time}</span>
                                </div>
                            </>
                        )}

                        {relativeTime && (
                            <>
                                <span className="text-muted-foreground/50">
                                    •
                                </span>
                                <span className="font-medium text-foreground">
                                    {relativeTime}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl leading-tight font-bold tracking-tight md:text-5xl">
                        {newsItem.title}
                    </h1>
                </header>

                {/* Featured image */}
                {newsItem.image_url && (
                    <div className="overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={newsItem.image_url}
                            alt={newsItem.title}
                            className="w-full object-cover"
                            style={{ aspectRatio: '16/9' }}
                        />
                    </div>
                )}

                {/* Article content */}
                <div className="border-t pt-8">
                    <div
                        className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:border md:prose-lg max-w-none"
                        dangerouslySetInnerHTML={{
                            __html:
                                newsItem.body_html ??
                                '<p class="text-muted-foreground">Tidak ada konten.</p>',
                        }}
                    />
                </div>

                {/* Footer separator */}
                <div className="border-t pt-8">
                    <Link
                        href="/student/news"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Lihat berita lainnya</span>
                    </Link>
                </div>
            </article>
        </AppLayout>
    );
}
