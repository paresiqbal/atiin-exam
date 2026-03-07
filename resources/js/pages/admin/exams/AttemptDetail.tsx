import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

import { AttemptQuestionList } from '@/components/AttemptQuestionList';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { ArrowLeft, CheckCircle2, Download, FileText, XCircle } from 'lucide-react';

interface QuestionDetail {
    id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    points_earned: number;
}

interface QuestionPerformance {
    total: number;
    correct: number;
    percentage: number;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        total_score: number;
        started_at: string | null;
        completed_at: string | null;
    };
    exam: {
        id: number;
        name: string;
        description?: string | null;
        irt_processed_at?: string | null;
    };
    questionBankCount: number;
    student: {
        name: string;
        email: string;
        university: { name: string | null } | null;
        major: { name: string | null } | null;
    };
    passingScore: number;
    isPassed: boolean;
    questionDetails: QuestionDetail[];
    questionPerformance: Record<number, QuestionPerformance>;
}

export default function AttemptDetail({
    attempt,
    exam,
    questionBankCount,
    student,
    passingScore,
    isPassed,
    questionDetails,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Ujian', href: '/admin/exams' },
        { title: exam.name, href: `/admin/exams/${exam.id}` },
        { title: 'Percobaan', href: `/admin/exams/${exam.id}/attempts` },
        { title: 'Detail', href: '#' },
    ];

    const bankDivisor =
        typeof questionBankCount === 'number' && questionBankCount > 0
            ? questionBankCount
            : 1;

    const adjustedScore = useMemo(() => {
        return attempt.score / bankDivisor;
    }, [attempt.score, bankDivisor]);

    const adjustedTotalScore = useMemo(() => {
        return attempt.total_score / bankDivisor;
    }, [attempt.total_score, bankDivisor]);

    const percentage = useMemo(() => {
        if (!adjustedTotalScore || adjustedTotalScore <= 0) return 0;
        return (adjustedScore / adjustedTotalScore) * 100;
    }, [adjustedScore, adjustedTotalScore]);

    const timeTaken = useMemo(() => {
        if (!attempt.started_at || !attempt.completed_at) return null;

        const start = new Date(attempt.started_at);
        const end = new Date(attempt.completed_at);

        const diffMs = end.getTime() - start.getTime();
        if (Number.isNaN(diffMs) || diffMs <= 0) return null;

        const totalMinutes = Math.floor(diffMs / 1000 / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }

        return `${minutes} min`;
    }, [attempt.started_at, attempt.completed_at]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Percobaan - ${exam.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Detail Percobaan
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {exam.name} &mdash; {student.name}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/exams/${exam.id}/attempts`}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Percobaan
                            </Button>
                        </Link>

                        {exam.irt_processed_at ? (
                            <>
                                <a
                                    href={`/admin/attempts/${attempt.id}/download-pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex"
                                >
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        type="button"
                                    >
                                        <Download className="h-4 w-4" />
                                        Unduh PDF
                                    </Button>
                                </a>

                                <a
                                    href={`/admin/attempts/${attempt.id}/download-letter`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex"
                                >
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        type="button"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Unduh Surat
                                    </Button>
                                </a>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Top Summary Card */}
                <Card
                    className={cn(
                        'overflow-hidden border-2',
                        isPassed
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-destructive/20 bg-destructive/5',
                    )}
                >
                    <CardContent className="space-y-6 p-6 md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow">
                                    {isPassed ? (
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    ) : (
                                        <XCircle className="h-10 w-10 text-destructive" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                        Hasil Keseluruhan
                                    </p>
                                    <p
                                        className={cn(
                                            'text-2xl font-bold',
                                            isPassed
                                                ? 'text-green-700'
                                                : 'text-destructive',
                                        )}
                                    >
                                        {isPassed ? 'LULUS' : 'GAGAL'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Completed on{' '}
                                        {attempt.completed_at
                                            ? new Date(
                                                  attempt.completed_at,
                                              ).toLocaleString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-right md:grid-cols-3 md:text-left">
                                <div className="rounded-lg border bg-background px-4 py-3 text-left">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Skor
                                    </p>
                                    <p className="text-xl font-bold">
                                        {Math.floor(adjustedScore)}{' '}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            / {Math.floor(adjustedTotalScore)}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-background px-4 py-3 text-left">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Persentase
                                    </p>
                                    <p
                                        className={cn(
                                            'text-xl font-bold',
                                            isPassed
                                                ? 'text-green-600'
                                                : 'text-destructive',
                                        )}
                                    >
                                        {percentage.toFixed(2)}%
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-background px-4 py-3 text-left">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Passing Grade
                                    </p>
                                    <p className="text-xl font-bold">
                                        {passingScore}
                                    </p>
                                </div>

                                {timeTaken && (
                                    <div className="rounded-lg border bg-background px-4 py-3 text-left md:col-span-3">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Waktu yang Dihabiskan
                                        </p>
                                        <p className="text-xl font-bold">
                                            {timeTaken}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Student Info + Exam Info */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Informasi Siswa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Nama
                                </span>
                                <span className="font-medium">
                                    {student.name}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Email
                                </span>
                                <span className="font-medium">
                                    {student.email}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Universitas
                                </span>
                                <span className="font-medium">
                                    {student.university?.name ?? '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Program Studi
                                </span>
                                <span className="font-medium">
                                    {student.major?.name ?? '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Informasi Ujian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Ujian
                                </span>
                                <span className="font-medium">{exam.name}</span>
                            </div>
                            {exam.description && (
                                <div className="pt-2 text-xs text-muted-foreground">
                                    {exam.description}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Question Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rincian Pertanyaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AttemptQuestionList questions={questionDetails} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
