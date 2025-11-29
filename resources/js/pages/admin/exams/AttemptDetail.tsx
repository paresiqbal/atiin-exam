import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { ArrowLeft, CheckCircle2, Download, XCircle } from 'lucide-react';

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
    };
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
    student,
    passingScore,
    isPassed,
    questionDetails,
    questionPerformance,
}: Props) {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Ujian', href: '/admin/exams' },
        { title: exam.name, href: `/admin/exams/${exam.id}` },
        { title: 'Attempts', href: `/admin/exams/${exam.id}/attempts` },
        { title: 'Details', href: '#' },
    ];

    const percentage = useMemo(() => {
        if (!attempt.total_score || attempt.total_score <= 0) return 0;
        return (attempt.score / attempt.total_score) * 100;
    }, [attempt.score, attempt.total_score]);

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
            <Head title={`Attempt Details - ${exam.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Attempt Details
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {exam.name} &mdash; {student.name}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/exams/${exam.id}/attempts`}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Attempts
                            </Button>
                        </Link>

                        <Link
                            href={`/admin/attempts/${attempt.id}/download-pdf`}
                            as="a"
                            method="get"
                        >
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download PDF
                            </Button>
                        </Link>
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
                                        Overall Result
                                    </p>
                                    <p
                                        className={cn(
                                            'text-2xl font-bold',
                                            isPassed
                                                ? 'text-green-700'
                                                : 'text-destructive',
                                        )}
                                    >
                                        {isPassed ? 'PASSED' : 'FAILED'}
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
                                        Raw Score
                                    </p>
                                    <p className="text-xl font-bold">
                                        {attempt.score}{' '}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            / {attempt.total_score}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-background px-4 py-3 text-left">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Percentage
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
                                        Passing Score (points)
                                    </p>
                                    <p className="text-xl font-bold">
                                        {passingScore}
                                    </p>
                                </div>

                                {timeTaken && (
                                    <div className="rounded-lg border bg-background px-4 py-3 text-left md:col-span-3">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Time Taken
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
                                Student Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Name
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
                                    University
                                </span>
                                <span className="font-medium">
                                    {student.university?.name ?? '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Major
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
                                Exam Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Exam
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
                        <CardTitle>Question Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {questionDetails.length === 0 ? (
                            <p className="py-6 text-sm text-muted-foreground">
                                No questions found for this attempt.
                            </p>
                        ) : (
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full space-y-3"
                                value={expandedItem ?? undefined}
                                onValueChange={(val) =>
                                    setExpandedItem(val || null)
                                }
                            >
                                {questionDetails.map((question, index) => {
                                    const perf =
                                        questionPerformance[question.id];

                                    return (
                                        <AccordionItem
                                            key={question.id}
                                            value={String(question.id)}
                                            className="rounded-lg border bg-card px-4"
                                        >
                                            <AccordionTrigger className="py-3 hover:no-underline">
                                                <div className="flex w-full items-start gap-4 text-left">
                                                    <div className="mt-1">
                                                        {question.is_correct ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-destructive" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                Q{index + 1}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground uppercase">
                                                                {question.question_type.replace(
                                                                    /_/g,
                                                                    ' ',
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    question.points_earned
                                                                }
                                                                /
                                                                {
                                                                    question.points
                                                                }{' '}
                                                                pts
                                                            </span>
                                                            {perf && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    | Correct by{' '}
                                                                    {perf.percentage.toFixed(
                                                                        1,
                                                                    )}
                                                                    %
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 text-sm">
                                                            <div
                                                                className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: question.question_text,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="pt-0 pr-1 pb-4 pl-9">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {/* Student Answer */}
                                                    <div
                                                        className={cn(
                                                            'rounded-md border p-3',
                                                            question.is_correct
                                                                ? 'border-green-500/20 bg-green-500/10'
                                                                : 'border-destructive/20 bg-destructive/5',
                                                        )}
                                                    >
                                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                            Student Answer
                                                        </p>
                                                        {question.student_answer ? (
                                                            <div
                                                                className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: question.student_answer,
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic">
                                                                Not answered
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Correct Answer */}
                                                    <div className="rounded-md border bg-secondary/40 p-3">
                                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                            Correct Answer
                                                        </p>
                                                        {question.correct_answer ? (
                                                            <div
                                                                className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: question.correct_answer,
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic">
                                                                No correct
                                                                answer
                                                                configured
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
