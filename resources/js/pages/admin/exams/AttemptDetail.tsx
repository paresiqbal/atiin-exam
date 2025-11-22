import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface QuestionDetail {
    id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        completed_at: string;
    };
    exam: {
        id: number;
        name: string;
    };
    student: {
        name: string;
        email: string;
        university: { name: string };
        major: { name: string };
    };
    passingScore: number;
    isPassed: boolean;
    questionDetails: QuestionDetail[];
    questionPerformance: Record<
        number,
        { total: number; correct: number; percentage: number }
    >;
}

export default function AttemptDetail({
    attempt,
    exam,
    student,
    passingScore,
    isPassed,
    questionDetails,
}: Props) {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(
        null,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Ujian', href: '/admin/exams' },
        { title: exam.name, href: `/admin/exams/${exam.id}` },
        { title: 'Attempts', href: `/admin/exams/${exam.id}/attempts` },
        { title: 'Details', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attempt Details" />
            <div className="space-y-4 p-4">
                <h1 className="text-3xl font-bold">Attempt Details</h1>

                {/* Student Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold">{student.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold">{student.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    University
                                </p>
                                <p className="font-semibold">
                                    {student.university.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Major</p>
                                <p className="font-semibold">
                                    {student.major.name}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Score Summary */}
                <Card
                    className={
                        isPassed
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                    }
                >
                    <CardHeader>
                        <CardTitle
                            className={
                                isPassed ? 'text-green-800' : 'text-red-800'
                            }
                        >
                            {isPassed ? 'PASSED' : 'FAILED'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-gray-700">Score</p>
                            <p
                                className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {attempt.score.toFixed(2)}%
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-700">Passing Score</p>
                            <p className="font-semibold">{passingScore}%</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-700">Completed At</p>
                            <p className="font-semibold">
                                {new Date(
                                    attempt.completed_at,
                                ).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Question Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {questionDetails.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="rounded-lg border p-4"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedQuestion(
                                                expandedQuestion === question.id
                                                    ? null
                                                    : question.id,
                                            )
                                        }
                                        className="flex w-full items-start justify-between rounded p-2 text-left hover:bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {question.is_correct
                                                        ? 'Correct'
                                                        : 'Incorrect'}
                                                </span>
                                                <p className="font-semibold">
                                                    Question {index + 1}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    ({question.points_earned}/
                                                    {question.points} points)
                                                </p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700">
                                                {question.question_text}
                                            </p>
                                        </div>
                                        <span className="text-gray-500">
                                            {expandedQuestion === question.id
                                                ? '▼'
                                                : '▶'}
                                        </span>
                                    </button>

                                    {expandedQuestion === question.id && (
                                        <div className="mt-4 space-y-3 border-t pt-4">
                                            <div className="rounded bg-gray-50 p-3">
                                                <p className="text-sm text-gray-600">
                                                    Your Answer
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                    {question.student_answer ||
                                                        'Not answered'}
                                                </p>
                                            </div>
                                            <div
                                                className={`rounded p-3 ${question.is_correct ? 'bg-green-50' : 'bg-red-50'}`}
                                            >
                                                <p className="text-sm text-gray-600">
                                                    Correct Answer
                                                </p>
                                                <p className="font-semibold">
                                                    {question.correct_answer}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div className="flex gap-2">
                    <Link href={`/admin/exams/${exam.id}/attempts`}>
                        <Button variant="outline">Back to Attempts</Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
