import { Head, Link } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type UserMini = { id: number; name: string; email?: string };

type ConsultantRequest = {
    id: number;
    topic: string;
    message?: string | null;
    preferred_date?: string | null;
    status: string;
    created_at: string;
    student: UserMini;
    consultant: UserMini;
};

export default function Show({ request }: { request: ConsultantRequest }) {
    const statusColor = (s: string) => {
        switch (s) {
            case 'pending':
                return 'secondary';
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'done':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                {
                    title: 'Consultant Requests',
                    href: '/admin/consultant-requests',
                },
                { title: `#${request.id}`, href: '#' },
            ]}
        >
            <Head title={`Consultant Request #${request.id}`} />

            <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
                <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Request #{request.id}
                        </h1>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge variant={statusColor(request.status) as any}>
                                {request.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {request.created_at}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/consultant-requests">
                                Kembali
                            </Link>
                        </Button>
                        <Button asChild>
                            <a
                                href={`/admin/consultant-requests/${request.id}/print`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Print
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Siswa
                        </div>
                        <div className="font-medium">
                            {request.student?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {request.student?.email}
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Konsultan
                        </div>
                        <div className="font-medium">
                            {request.consultant?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {request.consultant?.email}
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Topik
                        </div>
                        <div className="font-medium">{request.topic}</div>

                        <div className="mt-3 text-sm text-muted-foreground">
                            Preferensi tanggal
                        </div>
                        <div className="font-medium">
                            {request.preferred_date ?? '-'}
                        </div>

                        <div className="mt-3 text-sm text-muted-foreground">
                            Detail
                        </div>
                        <div className="whitespace-pre-wrap">
                            {request.message ?? '-'}
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
