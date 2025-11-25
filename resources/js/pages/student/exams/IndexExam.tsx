import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { ExamIndexProps } from '@/types/exam';
import { Head, Link } from '@inertiajs/react';

interface Exam {
    id: number;
    name: string;
    start_at: string;
    end_at: string;
    status: 'available' | 'coming_soon' | 'ended';
    questionBank: {
        questions: Array<{ id: number }>;
    };
    settings: {
        time_limit: number;
    };
}

interface Props {
    exams: {
        data: Exam[];
        links: any;
    };
}

export default function IndexExam({ exams }: ExamIndexProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            available: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                label: 'Available',
            },
            coming_soon: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                label: 'Coming Soon',
            },
            ended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ended' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
            >
                {config.label}
            </span>
        );
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString();
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'Available Exams', href: '/student/exams' }]}
        >
            <Head title="Available Exams" />
            <div className="space-y-4 p-4">
                <h1 className="text-3xl font-bold">Available Exams</h1>

                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            No exams available for your class at this time.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                        {exams.data.map((exam) => (
                            <Card
                                key={exam.id}
                                className="transition-shadow hover:shadow-lg"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {exam.name}
                                            </CardTitle>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Questions:{' '}
                                                {
                                                    exam.questionBank.questions
                                                        .length
                                                }{' '}
                                                | Time:{' '}
                                                {exam.settings.time_limit}{' '}
                                                minutes
                                            </p>
                                        </div>
                                        <div>{getStatusBadge(exam.status)}</div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="text-sm">
                                            <p className="text-gray-600">
                                                Starts:{' '}
                                                {formatDateTime(exam.start_at)}
                                            </p>
                                            <p className="text-gray-600">
                                                Ends:{' '}
                                                {formatDateTime(exam.end_at)}
                                            </p>
                                        </div>
                                        {exam.status === 'available' && (
                                            <Link href="/student/exams/join">
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                    Join Exam
                                                </Button>
                                            </Link>
                                        )}
                                        {exam.status === 'coming_soon' && (
                                            <Button className="w-full" disabled>
                                                Coming Soon
                                            </Button>
                                        )}
                                        {exam.status === 'ended' && (
                                            <Button className="w-full" disabled>
                                                Exam Ended
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
