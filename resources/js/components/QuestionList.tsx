import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

import type { Question } from '@/types/question';

interface QuestionListProps {
    questions: Question[];
    onEdit: (question: Question) => void;
    onDelete: (id: number) => void;
}

export function QuestionList({
    questions,
    onEdit,
    onDelete,
}: QuestionListProps) {
    if (questions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {questions.map((question, idx) => (
                <Card key={question.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="mb-2 flex gap-2">
                                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                        Soal {idx + 1}
                                    </span>
                                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                        {question.question_type.replace(
                                            '_',
                                            ' ',
                                        )}
                                    </span>
                                    <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                        {question.points} point
                                    </span>
                                </div>
                                <CardTitle className="text-lg">
                                    {question.question_text}
                                </CardTitle>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(question)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogTitle>
                                            Hapus Soal?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                        <div className="flex gap-2">
                                            <AlertDialogCancel>
                                                Batal
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    onDelete(question.id)
                                                }
                                            >
                                                Hapus
                                            </AlertDialogAction>
                                        </div>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {question.image_url && (
                            <img
                                src={question.image_url || '/placeholder.svg'}
                                alt="Question"
                                className="h-auto max-w-xs rounded"
                            />
                        )}
                        <div>
                            <p className="mb-2 text-sm font-medium">Opsi:</p>
                            <div className="space-y-1">
                                {question.options.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={`rounded p-2 text-sm ${opt.is_correct ? 'bg-green-600/90' : 'bg-gray-500/90'}`}
                                    >
                                        {opt.option_text}{' '}
                                        {opt.is_correct && (
                                            <span className="ml-2 text-xs text-primary-foreground">
                                                ✓ Benar
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
