import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Download,
    Trophy,
    XCircle,
} from 'lucide-react';

interface QuestionDetail {
    id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
}

interface StudentPlacement {
    university: {
        id: number;
        name: string;
        city?: string | null;
    } | null;
    major: {
        id: number;
        name: string;
        minimum_passing_grade: number;
    } | null;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        total_score: number;
        completed_at: string;
    };
    exam: {
        title: string;
        description: string;
    };
    passingScore: number;
    isPassed: boolean;
    questionDetails: QuestionDetail[];
    studentPlacement?: StudentPlacement;
}

export default function Results({
    attempt,
    exam,
    passingScore,
    isPassed,
    questionDetails,
    studentPlacement,
}: Props) {
    const percentage = Math.round((attempt.score / attempt.total_score) * 100);

    const mainMessage = isPassed
        ? 'Congratulations! You reached the minimum grade for your chosen major.'
        : "You haven't reached the minimum grade for your chosen major yet.";

    const hasPlacementInfo =
        studentPlacement?.university && studentPlacement?.major;

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground">
            <Head title={`Results: ${exam.title}`} />

            <div className="container mx-auto max-w-4xl space-y-8">
                {/* Header / Back + Actions */}
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <Link href="/student/dashboard">
                        <Button
                            variant="ghost"
                            className="pl-0 transition-all hover:pl-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/student/exams/${attempt.id}/download-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download Results
                            </Button>
                        </a>

                        {/* New: go to universities */}
                        <Link href="/student/universities">
                            <Button variant="default">
                                Check other universities
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Score Card */}
                <Card
                    className={cn(
                        'overflow-hidden border-2',
                        isPassed
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-destructive/20 bg-destructive/5',
                    )}
                >
                    <CardContent className="space-y-6 p-8 text-center">
                        <div className="flex justify-center">
                            {isPassed ? (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {exam.title}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Badge
                                    variant={
                                        isPassed ? 'default' : 'destructive'
                                    }
                                    className="px-4 py-1 text-lg"
                                >
                                    {isPassed ? 'PASSED' : 'FAILED'}
                                </Badge>
                                <span className="text-muted-foreground">
                                    Completed on{' '}
                                    {new Date(
                                        attempt.completed_at,
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Main message about pass/fail relative to major */}
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    isPassed
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-destructive',
                                )}
                            >
                                {mainMessage}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Your Score
                                </div>
                                <div className="text-3xl font-bold">
                                    {attempt.score}{' '}
                                    <span className="text-base font-normal text-muted-foreground">
                                        / {attempt.total_score}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Percentage
                                </div>
                                <div
                                    className={cn(
                                        'text-3xl font-bold',
                                        isPassed
                                            ? 'text-green-600'
                                            : 'text-destructive',
                                    )}
                                >
                                    {percentage}%
                                </div>
                            </div>
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Passing Score
                                </div>
                                <div className="text-3xl font-bold">
                                    {passingScore}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected University & Major Card */}
                {hasPlacementInfo && (
                    <Card className="border border-muted">
                        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase">
                                    Your chosen path
                                </div>
                                <div className="mt-1 text-lg font-semibold">
                                    {studentPlacement!.major!.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    at{' '}
                                    <span className="font-medium">
                                        {studentPlacement!.university!.name}
                                    </span>
                                    {studentPlacement!.university!.city && (
                                        <>
                                            {' '}
                                            ·{' '}
                                            {studentPlacement!.university!.city}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">
                                    Minimum passing grade
                                </div>
                                <div className="text-2xl font-bold">
                                    {
                                        studentPlacement!.major!
                                            .minimum_passing_grade
                                    }
                                </div>
                                <div
                                    className={cn(
                                        'mt-1 text-xs font-medium',
                                        isPassed
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-destructive',
                                    )}
                                >
                                    {isPassed
                                        ? 'You can enter this program based on this exam.'
                                        : 'You cannot enter this program yet based on this exam.'}
                                </div>
                                <div className="mt-3">
                                    <Link href="/student/universities">
                                        <Button variant="outline" size="sm">
                                            Check other universities you may
                                            qualify for
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Question Breakdown */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Question Breakdown
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-4"
                    >
                        {questionDetails.map((question, index) => (
                            <AccordionItem
                                key={question.id}
                                value={`item-${question.id}`}
                                className="rounded-lg border bg-card px-4"
                            >
                                {/* Trigger */}
                                <AccordionTrigger className="py-4 hover:no-underline">
                                    <div className="flex w-full items-start gap-4 text-left">
                                        <div className="mt-1">
                                            {question.is_correct ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-destructive" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="pr-4 font-medium">
                                                <span className="mr-2 text-muted-foreground">
                                                    Q{index + 1}.
                                                </span>

                                                <div
                                                    className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                    dangerouslySetInnerHTML={{
                                                        __html: question.question_text,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div className="font-mono text-sm whitespace-nowrap text-muted-foreground">
                                            {question.points_earned} /{' '}
                                            {question.points} pts
                                        </div>
                                    </div>
                                </AccordionTrigger>

                                {/* Content */}
                                <AccordionContent className="pt-2 pb-4 pl-9">
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
                                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                                                Your Answer
                                            </div>

                                            <div className="font-medium">
                                                {question.student_answer ? (
                                                    <div
                                                        className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                        dangerouslySetInnerHTML={{
                                                            __html: question.student_answer,
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground italic">
                                                        No answer provided
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Correct Answer */}
                                        {!question.is_correct && (
                                            <div className="rounded-md border bg-secondary/50 p-3">
                                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                                    Correct Answer
                                                </div>

                                                <div className="font-medium text-green-600 dark:text-green-400">
                                                    <div
                                                        className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                        dangerouslySetInnerHTML={{
                                                            __html: question.correct_answer,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
