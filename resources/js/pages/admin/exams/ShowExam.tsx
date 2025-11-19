// resources/js/pages/admin/exams/ShowExam.tsx

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';

interface Option {
    id: number;
    // NOTE: adjust "text" to your actual column name if different (e.g. "content")
    text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    // NOTE: adjust "text" to your actual column name if different (e.g. "question_text")
    text: string;
    options: Option[];
}

interface QuestionBank {
    id: number;
    name: string;
    questions: Question[];
}

interface ExamSettings {
    time_limit_minutes: number;
    shuffle_questions: boolean;
    allow_review: boolean;
    max_attempts: number;
}

interface ExamToken {
    id: number;
    token: string;
}

interface Exam {
    id: number;
    name: string;
    description: string | null;
    is_published: boolean;
    created_at: string;
    question_bank: QuestionBank | null;
    settings: ExamSettings;
    tokens: ExamToken[];
}

interface Props {
    exam: Exam;
}

export default function ShowExam({ exam }: Props) {
    const handlePublish = () => {
        if (exam.is_published) return;

        if (confirm('Publish this exam? Students will be able to take it.')) {
            router.post(`/admin/exams/${exam.id}/publish`);
        }
    };

    const primaryToken = exam.tokens[0]?.token ?? null;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Exams', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
            ]}
        >
            <Head title={`Exam - ${exam.name}`} />

            <div className="space-y-4 p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold">{exam.name}</h1>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    exam.is_published
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                                {exam.is_published ? 'Published' : 'Draft'}
                            </span>
                            <span>Created at: {exam.created_at}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        {!exam.is_published && (
                            <Button onClick={handlePublish}>
                                Publish Exam
                            </Button>
                        )}
                        <Link href="/admin/exams">
                            <Button variant="outline">Back to Exams</Button>
                        </Link>
                    </div>
                </div>

                {/* Description + Settings */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Description & token */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Description
                                </h2>
                                <p className="mt-2 text-sm text-gray-700">
                                    {exam.description || (
                                        <span className="text-gray-400 italic">
                                            No description provided.
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold">
                                    Question Bank
                                </h2>
                                <p className="mt-2 text-sm text-gray-700">
                                    {exam.question_bank ? (
                                        exam.question_bank.name
                                    ) : (
                                        <span className="text-gray-400 italic">
                                            No question bank associated.
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold">
                                    Access Token
                                </h2>
                                {primaryToken ? (
                                    <p className="mt-2 rounded bg-gray-100 px-3 py-2 font-mono text-sm">
                                        {primaryToken}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">
                                        No token generated.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <h2 className="text-lg font-semibold">
                                Exam Settings
                            </h2>
                            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                <div>
                                    <dt className="font-medium">
                                        Time Limit (minutes)
                                    </dt>
                                    <dd className="text-gray-700">
                                        {exam.settings?.time_limit_minutes}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium">
                                        Shuffle Questions
                                    </dt>
                                    <dd className="text-gray-700">
                                        {exam.settings?.shuffle_questions
                                            ? 'Yes'
                                            : 'No'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium">
                                        Allow Review
                                    </dt>
                                    <dd className="text-gray-700">
                                        {exam.settings?.allow_review
                                            ? 'Yes'
                                            : 'No'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-medium">
                                        Max Attempts
                                    </dt>
                                    <dd className="text-gray-700">
                                        {exam.settings?.max_attempts}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {/* Questions */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Questions</h2>
                            <span className="text-sm text-gray-500">
                                {exam.question_bank?.questions?.length ?? 0}{' '}
                                question
                                {(exam.question_bank?.questions?.length ??
                                    0) === 1
                                    ? ''
                                    : 's'}
                            </span>
                        </div>

                        {exam.question_bank?.questions?.length ? (
                            <div className="space-y-4">
                                {exam.question_bank.questions.map(
                                    (question, index) => (
                                        <div
                                            key={question.id}
                                            className="rounded border border-gray-200 p-4"
                                        >
                                            <div className="mb-2 font-medium">
                                                {index + 1}. {question.text}
                                            </div>

                                            {question.options?.length ? (
                                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                                    {question.options.map(
                                                        (option) => (
                                                            <li
                                                                key={option.id}
                                                                className={
                                                                    option.is_correct
                                                                        ? 'font-semibold text-green-700'
                                                                        : ''
                                                                }
                                                            >
                                                                {option.text}
                                                                {option.is_correct && (
                                                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                                                        Correct
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500">
                                                    No options defined for this
                                                    question.
                                                </p>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No questions found for this question bank.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
