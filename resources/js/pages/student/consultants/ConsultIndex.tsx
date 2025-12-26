import { Head, Link } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type Consultant = {
    id: number;
    name: string;
    email?: string;
};

type ConsultantRequest = {
    id: number;
    topic: string;
    status: 'pending' | 'approved' | 'rejected' | 'done';
    preferred_date: string | null;
    created_at: string;
    consultant: Consultant | null;
};

type Paginated<T> = {
    data: T[];
};

const statusLabel: Record<ConsultantRequest['status'], string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    done: 'Selesai',
};

const statusVariant: Record<
    ConsultantRequest['status'],
    'secondary' | 'default' | 'destructive' | 'outline'
> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    done: 'outline',
};

function formatDate(date: string) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function Index({
    requests,
}: {
    requests: Paginated<ConsultantRequest>;
}) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'Konsultasi', href: '/student/consultant-requests' },
            ]}
        >
            <Head title="Konsultasi" />

            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold md:text-2xl">
                            Konsultasi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Daftar permintaan konsultasi kamu.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/student/consultant-requests/create">
                            Buat Request
                        </Link>
                    </Button>
                </div>

                {/* List */}
                {requests.data.length === 0 ? (
                    <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
                        Belum ada request konsultasi.
                        <br />
                        Klik <span className="font-medium">
                            “Buat Request”
                        </span>{' '}
                        untuk memulai.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.data.map((r) => (
                            <div
                                key={r.id}
                                className="rounded-lg border p-4 transition hover:bg-muted/30"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-sm leading-snug font-semibold md:text-base">
                                        {r.topic}
                                    </h2>

                                    <Badge variant={statusVariant[r.status]}>
                                        {statusLabel[r.status]}
                                    </Badge>
                                </div>

                                {/* Meta */}
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    <div>
                                        <span className="font-medium text-foreground">
                                            Konsultan:
                                        </span>{' '}
                                        {r.consultant?.name ?? '-'}
                                    </div>

                                    <div>
                                        <span className="font-medium text-foreground">
                                            Tanggal request:
                                        </span>{' '}
                                        {formatDate(r.created_at)}
                                    </div>

                                    {r.preferred_date && (
                                        <div>
                                            <span className="font-medium text-foreground">
                                                Tanggal diinginkan:
                                            </span>{' '}
                                            {formatDate(r.preferred_date)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
