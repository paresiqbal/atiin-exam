import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

interface Attempt {
    id: number;
    score: number | string; // in case backend sends string
    completed_at: string;
    student: {
        id: number;
        name: string;
        email: string;
        university: { name: string };
        major: { name: string };
    };
}

interface Analytics {
    total_attempts: number;
    passed: number;
    average_score: number | string | null; // backend may send string
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    exam: {
        id: number;
        name: string;
    };
    attempts: {
        data: Attempt[];
        links: PaginationLink[];
    };
    analytics: Analytics;
}

export default function ExamAttempts({ exam, attempts, analytics }: Props) {
    // Convert average score safely into a REAL number:
    const averageScore = Number(analytics.average_score ?? 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Exams', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
                { title: 'Attempts', href: '#' },
            ]}
        >
            <Head title={`${exam.name} - Attempts`} />

            <div className="space-y-4 p-4">
                <h1 className="text-3xl font-bold">{exam.name} - Attempts</h1>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Total Attempts */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Attempts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analytics.total_attempts}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Passed Count */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Passed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {analytics.passed}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Score */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Average Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {averageScore.toFixed(2)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attempts Table */}
                {attempts.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            No attempts yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg">
                        <table className="w-full">
                            <thead className="border-b bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        University
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Major
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Completed At
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {attempts.data.map((attempt) => {
                                    const score = Number(attempt.score);

                                    return (
                                        <tr
                                            key={attempt.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium">
                                                {attempt.student.name}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {
                                                    attempt.student.university
                                                        .name
                                                }
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {attempt.student.major.name}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        score >= 60
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {score.toFixed(2)}%
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {new Date(
                                                    attempt.completed_at,
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <Link
                                                    href={`/admin/exams/attempts/${attempt.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
