import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface ExamData {
    id: number;
    name: string;
    description: string;
    is_published: boolean;
    question_bank: {
        name: string;
    } | null;
    attempts_count: number;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    exams: {
        data: ExamData[];
        links: PaginationLink[];
    };
}

export default function IndexExam({ exams }: Props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        if (
            confirm(
                'Are you sure? If the exam has been taken by students, it cannot be deleted.',
            )
        ) {
            router.delete(`/admin/exams/${id}`);
            setDeleteId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Exams', href: '/admin/exams' }]}>
            <Head title="Exams" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Exams</h1>
                    <Link href="/admin/exams/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Create Exam
                        </Button>
                    </Link>
                </div>

                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            No exams created yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg">
                        <table className="w-full">
                            <thead className="border-b bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Question Bank
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Attempts
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.data.map((exam) => (
                                    <tr
                                        key={exam.id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            {exam.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {exam.question_bank?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {exam.is_published
                                                    ? 'Published'
                                                    : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {exam.attempts_count}
                                        </td>
                                        <td className="flex space-x-2 px-6 py-4 text-sm">
                                            <Link
                                                href={`/admin/exams/${exam.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/admin/exams/${exam.id}/edit`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(exam.id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
