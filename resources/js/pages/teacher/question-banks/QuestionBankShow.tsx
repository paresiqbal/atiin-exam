// QuestionBankShow.tsx

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Plus } from 'lucide-react';

import { QuestionFormDialog } from '@/components/QuestionFormDialog';
import { QuestionList } from '@/components/QuestionList';
import type { Question, QuestionBank } from '@/types/question';

export default function QuestionBankShow({
    questionBank,
}: {
    questionBank: QuestionBank;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(
        null,
    );

    const breadcrumbs = [
        { title: 'Bank Soal', href: '/teacher/question-banks' },
        {
            title: 'Soal Ujian',
            href: `/teacher/question-banks/${questionBank.id}`,
        },
    ];

    const handleCreateClick = () => {
        setEditingQuestion(null);
        setDialogOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setDialogOpen(true);
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

                    <QuestionFormDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        questionBankId={questionBank.id}
                        editingQuestion={editingQuestion}
                    />
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
