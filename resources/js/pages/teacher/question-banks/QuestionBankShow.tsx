// resources/js/pages/teacher/question-banks/QuestionBankShow.tsx

import { Head, router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Plus } from 'lucide-react';

import { QuestionList } from '@/components/QuestionList';
import type { Question, QuestionBank } from '@/types/question';

export default function QuestionBankShow({
    questionBank,
}: {
    questionBank: QuestionBank;
}) {
    const breadcrumbs = [
        { title: 'Bank Soal', href: '/teacher/question-banks' },
        {
            title: 'Soal Ujian',
            href: `/teacher/question-banks/${questionBank.id}`,
        },
    ];

    const handleCreateClick = () => {
        // go to QuestionFormPage (create mode)
        router.visit(
            `/teacher/question-banks/${questionBank.id}/questions/create`,
        );
    };

    const handleEditQuestion = (question: Question) => {
        // go to QuestionFormPage (edit mode)
        router.visit(`/teacher/questions/${question.id}/edit`);
    };

    const handleDeleteQuestion = (id: number) => {
        router.delete(`/teacher/questions/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${questionBank.name} - Questions`} />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-3xl font-bold">{questionBank.name}</h1>
                    {questionBank.description && (
                        <p className="mt-1 text-sm text-gray-600">
                            {questionBank.description}
                        </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                        {questionBank.questions.length} soal
                    </p>
                </div>

                <div>
                    <Button
                        onClick={handleCreateClick}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Soal
                    </Button>
                </div>

                {questionBank.questions.length > 0 ? (
                    <QuestionList
                        questions={questionBank.questions}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                    />
                ) : (
                    <Card className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="mb-4 text-gray-500">Belum ada soal</p>
                            <Button
                                onClick={handleCreateClick}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Buat Soal Pertama
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
