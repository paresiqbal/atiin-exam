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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, FileText, Users, Zap } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface DashboardData {
    statistics: {
        users: {
            total: number;
            students: number;
            teachers: number;
            admins: number;
        };
        exams: {
            total: number;
            published: number;
            draft: number;
        };
        attempts: {
            total: number;
            completed: number;
            in_progress: number;
            passed: number;
            failed: number;
        };
        questions: {
            total: number;
            banks: number;
        };
        average_score: number;
    };
    recent_attempts: Array<{
        id: number;
        student_name: string;
        exam_name: string;
        score: number;
        total_score: number;
        percentage: number;
        passed: boolean;
        completed_at: string;
    }>;
    exam_performance: Array<{
        name: string;
        total_attempts: number;
        passed: number;
        failed: number;
        pass_rate: number;
    }>;
    student_activity: Array<{
        name: string;
        email: string;
        total_exams: number;
        passed: number;
        failed: number;
    }>;
}

export default function AdminDashboard({
    statistics,
    recent_attempts,
    exam_performance,
    student_activity,
}: DashboardData) {
    const passFailData = [
        {
            name: 'Passed',
            value: statistics.attempts.passed,
            fill: 'hsl(var(--chart-2))',
        },
        {
            name: 'Failed',
            value: statistics.attempts.failed,
            fill: 'hsl(var(--chart-3))',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Users Card */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Total Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.users.total}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {statistics.users.students} students,{' '}
                                        {statistics.users.teachers} teachers
                                    </p>
                                </div>
                                <Users className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Exams Card */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Total Exams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.exams.total}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {statistics.exams.published} published,{' '}
                                        {statistics.exams.draft} draft
                                    </p>
                                </div>
                                <FileText className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Exam Attempts Card */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Exam Attempts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.attempts.total}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {statistics.attempts.completed}{' '}
                                        completed,{' '}
                                        {statistics.attempts.in_progress} in
                                        progress
                                    </p>
                                </div>
                                <Zap className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Score Card */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Average Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {statistics.average_score}%
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {statistics.attempts.passed} passed,{' '}
                                        {statistics.attempts.failed} failed
                                    </p>
                                </div>
                                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Pass/Fail Distribution */}
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Pass/Fail Distribution
                            </CardTitle>
                            <CardDescription>
                                Overall exam attempt outcomes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={passFailData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {passFailData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.fill}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Exam Performance */}
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Exam Performance
                            </CardTitle>
                            <CardDescription>Pass rate by exam</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    pass_rate: {
                                        label: 'Pass Rate %',
                                        color: 'hsl(var(--chart-2))',
                                    },
                                }}
                                className="h-64"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={exam_performance}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            interval={0}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis />
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                        />
                                        <Bar
                                            dataKey="pass_rate"
                                            fill="var(--color-pass_rate)"
                                            name="Pass Rate %"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Attempts & Student Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Attempts */}
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Recent Exam Attempts
                            </CardTitle>
                            <CardDescription>
                                Last 5 completed attempts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recent_attempts.map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {attempt.student_name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {attempt.exam_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {attempt.completed_at}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="text-sm font-semibold">
                                                {attempt.percentage}%
                                            </p>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    attempt.passed
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}
                                            >
                                                {attempt.passed
                                                    ? 'Passed'
                                                    : 'Failed'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Students */}
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Top Student Activity
                            </CardTitle>
                            <CardDescription>
                                Most active students
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {student_activity.map((student, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {student.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {student.email}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="text-sm font-semibold">
                                                {student.total_exams} exams
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {student.passed} passed,{' '}
                                                {student.failed} failed
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
