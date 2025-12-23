import { Head, Link, router } from '@inertiajs/react';
import * as React from 'react';

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

type UserMini = { id: number; name: string; email?: string };

type ConsultantRequest = {
    id: number;
    topic: string;
    status: string;
    created_at: string;
    student: UserMini;
    consultant: UserMini;
};

type Paginated<T> = { data: T[] };

export default function Index({
    requests,
    filters,
}: {
    requests: Paginated<ConsultantRequest>;
    filters: { status?: string | null };
}) {
    const [status, setStatus] = React.useState(filters?.status ?? '');

    const applyFilter = () => {
        router.get(
            '/admin/consultant-requests',
            { status: status || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

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
            ]}
        >
            <Head title="Consultant Requests" />

            <div className="p-4 md:p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Consultant Requests
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Data request konsultasi dari siswa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                            <option value="done">done</option>
                        </select>
                        <Button onClick={applyFilter}>Filter</Button>
                    </div>
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Siswa</TableHead>
                                <TableHead>Konsultan</TableHead>
                                <TableHead>Topik</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Tidak ada data.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>#{r.id}</TableCell>
                                        <TableCell>
                                            {r.student?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {r.consultant?.name ?? '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {r.topic}
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
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/consultant-requests/${r.id}`}
                                                    >
                                                        Detail
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={`/admin/consultant-requests/${r.id}/print`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Print
                                                    </a>
                                                </Button>
                                            </div>
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
