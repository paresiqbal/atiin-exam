'use client';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
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
import { Head, Link } from '@inertiajs/react';
import { Award, BookOpen, Target, TrendingUp } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

interface StudentDashboardProps {
    student_info?: {
        name: string;
        email: string;
        university: string;
        major: string;
        school: string;
        class: string;
    };
    statistics?: {
        total_exams: number;
        passed_exams: number;
        failed_exams: number;
        average_score: number;
        pass_rate: number;
        passing_grade: number;
    };
    recent_attempts?: Array<{
        id: number;
        exam_name: string;
        score: number;
        total_score: number;
        percentage: number;
        status: 'passed' | 'failed';
        completed_at: string;
        time_taken: string;
    }>;
    score_trend?: Array<{
        exam_number: number;
        exam_name: string;
        score: number;
        percentage: number;
    }>;
    performance_by_exam?: Array<{
        exam_name: string;
        correct_answers: number;
        total_questions: number;
        accuracy: number;
        status: 'passed' | 'failed';
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/student/dashboard' },
];

export default function StudentDashboard({
    student_info,
    statistics,
    recent_attempts,
    score_trend,
    performance_by_exam,
}: StudentDashboardProps) {
    // ✅ Safe fallbacks so nothing crashes if BE sends nothing / wrong key
    const info = student_info ?? {
        name: 'Student',
        email: '',
        university: '-',
        major: '-',
        school: '-',
        class: '-',
    };

    const stats = statistics ?? {
        total_exams: 0,
        passed_exams: 0,
        failed_exams: 0,
        average_score: 0,
        pass_rate: 0,
        passing_grade: 0,
    };

    const attempts = recent_attempts ?? [];
    const trend = score_trend ?? [];
    const examPerf = performance_by_exam ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {info.name}!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {info.university} • {info.major} • {info.class}
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Total Exams
                                    </CardTitle>
                                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_exams}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Exams taken
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Passed
                                    </CardTitle>
                                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.passed_exams}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Successfully passed
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Failed
                                    </CardTitle>
                                    <Award className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {stats.failed_exams}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Need improvement
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Average Score
                                    </CardTitle>
                                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.average_score}%
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Overall
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Pass Rate
                                    </CardTitle>
                                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.pass_rate}%
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Success rate
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Score Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Score Trend</CardTitle>
                                <CardDescription>
                                    Your performance over recent exams
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{
                                        percentage: {
                                            label: 'Score %',
                                            color: 'hsl(var(--chart-1))',
                                        },
                                    }}
                                    className="h-80"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart data={trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="exam_number" />
                                            <YAxis domain={[0, 100]} />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent />
                                                }
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="percentage"
                                                stroke="var(--color-percentage)"
                                                dot={{
                                                    fill: 'var(--color-percentage)',
                                                }}
                                                name="Score %"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Accuracy by Exam */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Accuracy by Exam</CardTitle>
                                <CardDescription>
                                    Correct answers percentage per exam
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{
                                        accuracy: {
                                            label: 'Accuracy %',
                                            color: 'hsl(var(--chart-2))',
                                        },
                                    }}
                                    className="h-80"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={examPerf}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="exam_name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                interval={0}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis domain={[0, 100]} />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent />
                                                }
                                            />
                                            <Bar
                                                dataKey="accuracy"
                                                fill="var(--color-accuracy)"
                                                name="Accuracy %"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Attempts */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Exam Attempts</CardTitle>
                                    <CardDescription>
                                        Your last 5 completed exams
                                    </CardDescription>
                                </div>
                                <Link
                                    href="/student/exam-history"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exam</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Percentage</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time Taken</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attempts.length > 0 ? (
                                            attempts.map((attempt) => (
                                                <TableRow key={attempt.id}>
                                                    <TableCell className="font-medium">
                                                        {attempt.exam_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.score}/
                                                        {attempt.total_score}
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.percentage}%
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                attempt.status ===
                                                                'passed'
                                                                    ? 'default'
                                                                    : 'destructive'
                                                            }
                                                        >
                                                            {attempt.status ===
                                                            'passed'
                                                                ? 'Passed'
                                                                : 'Failed'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.completed_at}
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.time_taken}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="py-8 text-center text-muted-foreground"
                                                >
                                                    No exam attempts yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
