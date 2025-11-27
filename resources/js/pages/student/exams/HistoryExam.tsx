'use client';

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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ExamAttempt {
    id: number;
    exam: {
        id: number;
        title: string; // or name, depending on your DB
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
    { title: 'Exam History', href: '/student/exam-history' },
];

export default function HistoryExam({ attempts }: ExamHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(attempts.current_page);

    const filteredAttempts = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return attempts.data.filter((attempt) => {
            const name = attempt.exam?.title || ''; // or exam?.name
            return name.toLowerCase().includes(query);
        });
    }, [searchQuery, attempts.data]);

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
            <Head title="Exam History" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-5xl space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                            Exam History
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Review all your exam attempts and download results
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-10"
                        />
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    Total Attempts
                                </CardTitle>
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
                                    Passed
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {
                                        attempts.data.filter((a) => a.is_passed)
                                            .length
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    Average Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {attempts.data.length > 0
                                        ? (
                                              attempts.data.reduce(
                                                  (sum, a) =>
                                                      sum + a.percentage,
                                                  0,
                                              ) / attempts.data.length
                                          ).toFixed(1)
                                        : 0}
                                    %
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attempts Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Attempts</CardTitle>
                            <CardDescription>
                                Detailed view of each exam attempt
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredAttempts.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredAttempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {attempt.exam?.title}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {attempt.completed_at}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {attempt.score}/
                                                        {attempt.total_score}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {attempt.percentage}%
                                                    </p>
                                                </div>

                                                <Badge
                                                    variant={
                                                        attempt.is_passed
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                    className="whitespace-nowrap"
                                                >
                                                    {attempt.is_passed
                                                        ? 'Passed'
                                                        : 'Failed'}
                                                </Badge>

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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                                        No attempts found
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination */}
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
