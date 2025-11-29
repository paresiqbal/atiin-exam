import { Head } from '@inertiajs/react';
import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ExamAttempt {
    id: number;
    exam: {
        id: number;
        title: string; // or name
    };
    score: number;
    total_score: number;
    percentage: number;
    is_passed: boolean;
    completed_at: string;
}

interface ExamHistoryProps {
    attempts: {
        data: ExamAttempt[];
        current_page: number;
        total: number;
        last_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
    { title: 'History Ujian', href: '/student/exam-history' },
];

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function HistoryExam({ attempts }: ExamHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(attempts.current_page);

    const filteredAttempts = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return attempts.data.filter((attempt) => {
            const name = attempt.exam?.title || '';
            return name.toLowerCase().includes(query);
        });
    }, [searchQuery, attempts.data]);

    const passedCount = attempts.data.filter((a) => a.is_passed).length;
    const avgPercentage =
        attempts.data.length > 0
            ? (
                  attempts.data.reduce((sum, a) => sum + a.percentage, 0) /
                  attempts.data.length
              ).toFixed(1)
            : '0.0';

    const handleDownloadPDF = async (attemptId: number) => {
        try {
            const response = await fetch(
                `/student/exams/${attemptId}/download-pdf`,
            );
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `exam-results-${attemptId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History Ujian" />

            <div className="p-4">
                <div className="mx-auto max-w-full space-y-6">
                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">History Ujian</h1>
                        <p className="text-muted-foreground">
                            Tinjau semua percobaan ujian Anda dan unduh
                            hasilnya.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari ujian..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-9"
                        />
                    </div>

                    {/* Summary Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    Total Percobaan
                                </CardTitle>
                                <CardDescription>
                                    Jumlah semua percobaan ujian Anda.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {attempts.total}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    Lulus
                                </CardTitle>
                                <CardDescription>
                                    Total percobaan dengan status lulus.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {passedCount}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    Skor Rata-rata
                                </CardTitle>
                                <CardDescription>
                                    Rata-rata persentase dari semua percobaan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {avgPercentage}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attempts Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Semua Percobaan</CardTitle>
                            <CardDescription>
                                Tinjauan rinci dari setiap percobaan ujian.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredAttempts.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ujian</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead className="text-center">
                                                    Skor
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Persentase
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Aksi
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAttempts.map((attempt) => (
                                                <TableRow key={attempt.id}>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {
                                                                attempt.exam
                                                                    ?.title
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(
                                                                attempt.completed_at,
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {attempt.score}/
                                                        {attempt.total_score}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {attempt.percentage.toFixed(
                                                            1,
                                                        )}
                                                        %
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={
                                                                attempt.is_passed
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            className="whitespace-nowrap"
                                                        >
                                                            {attempt.is_passed
                                                                ? 'Lulus'
                                                                : 'Tidak Lulus'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDownloadPDF(
                                                                    attempt.id,
                                                                )
                                                            }
                                                            className="gap-2"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            PDF
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    Tidak ada percobaan yang ditemukan.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination (client-side page state only) */}
                    {attempts.last_page > 1 && (
                        <div className="flex justify-center gap-2">
                            {Array.from(
                                { length: attempts.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Button
                                    key={page}
                                    variant={
                                        page === currentPage
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
