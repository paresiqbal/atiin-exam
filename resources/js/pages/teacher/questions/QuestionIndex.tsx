import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_select' | 'true_false';
    points: number;
    image_url?: string;
    options: Array<{
        id: number;
        option_text: string;
        is_correct: boolean;
    }>;
}

interface Props {
    questionBank: {
        id: number;
        name: string;
        questions: Question[];
    };
}

const typeColors: Record<string, string> = {
    multiple_choice: 'bg-blue-100 text-blue-800',
    multiple_select: 'bg-purple-100 text-purple-800',
    true_false: 'bg-green-100 text-green-800',
};

const typeLabels: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    multiple_select: 'Multiple Select',
    true_false: 'True/False',
};

export default function QuestionIndex({ questionBank }: Props) {
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy } = useForm();

    const filteredQuestions = questionBank.questions.filter((q) =>
        q.question_text.toLowerCase().includes(search.toLowerCase()),
    );

    const handleDelete = (id: number) => {
        destroy(`/teacher/question-banks/${questionBank.id}/questions/${id}`, {
            onSuccess: () => setDeleteId(null),
        });
    };

    const breadcrumbs = [
        { title: 'Bank Soal', href: '/teacher/question-banks' },
        {
            title: '',
            href: `/teacher/question-banks/${questionBank.id}`,
        },
        { title: 'Questions', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${questionBank.name} - Questions`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {questionBank.name}
                        </h1>
                        <p className="mt-1 text-gray-600">
                            {filteredQuestions.length} questions
                        </p>
                    </div>
                    <Link
                        href={`/teacher/question-banks/${questionBank.id}/questions/create`}
                    >
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Question
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Questions List */}
                {filteredQuestions.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
                            <p className="text-gray-500">No questions found</p>
                            <Link
                                href={`/teacher/question-banks/${questionBank.id}/questions/create`}
                            >
                                <Button variant="outline" size="sm">
                                    Create First Question
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((question) => (
                            <Card
                                key={question.id}
                                className="transition-shadow hover:shadow-md"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex flex-1 flex-col gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    className={
                                                        typeColors[
                                                            question
                                                                .question_type
                                                        ]
                                                    }
                                                >
                                                    {
                                                        typeLabels[
                                                            question
                                                                .question_type
                                                        ]
                                                    }
                                                </Badge>
                                                <Badge variant="outline">
                                                    {question.points} pts
                                                </Badge>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {question.question_text}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {question.options.length}{' '}
                                                options •{' '}
                                                {
                                                    question.options.filter(
                                                        (o) => o.is_correct,
                                                    ).length
                                                }{' '}
                                                correct
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/teacher/question-banks/${questionBank.id}/questions/${question.id}/edit`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteId(question.id)
                                                }
                                                className="gap-2 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation */}
                <AlertDialog
                    open={deleteId !== null}
                    onOpenChange={() => setDeleteId(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this question?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex justify-end gap-3">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() =>
                                    deleteId && handleDelete(deleteId)
                                }
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
