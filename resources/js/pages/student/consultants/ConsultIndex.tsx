import { Head, Link } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Consultant = { id: number; name: string; email?: string };

type ConsultantRequest = {
    id: number;
    topic: string;
    status: string;
    preferred_date: string | null;
    created_at: string;
    consultant: Consultant;
};

type Paginated<T> = {
    data: T[];
    links?: any;
};

export default function Index({
    requests,
}: {
    requests: Paginated<ConsultantRequest>;
}) {
    const statusColor = (status: string) => {
        switch (status) {
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
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'Konsultasi', href: '/student/consultant-requests' },
            ]}
        >
            <Head title="Konsultasi" />

            <div className="p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Konsultasi</h1>
                        <p className="text-sm text-muted-foreground">
                            List request konsultasi kamu.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/student/consultant-requests/create">
                            Buat Request
                        </Link>
                    </Button>
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Topik</TableHead>
                                <TableHead>Konsultan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Tgl Request
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Belum ada request. Klik “Buat
                                            Request”.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">
                                            {r.topic}
                                        </TableCell>
                                        <TableCell>
                                            {r.consultant?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    statusColor(r.status) as any
                                                }
                                            >
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {r.created_at}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
