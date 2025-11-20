// react
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// icons
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';

// types
import type { Question, QuestionBank, QuestionOption } from '@/types/question';

export default function QuestionBankShow({
    questionBank,
}: {
    questionBank: QuestionBank;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, reset, errors } = useForm({
        question_text: '',
        question_type: 'multiple_choice',
        points: 5,
        image_url: '',
        options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ],
    });

    const handleOpenDialog = () => {
        reset();
        setEditingId(null);
        setDialogOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        setData({
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            image_url: question.image_url || '',
            options: question.options,
        });
        setEditingId(question.id);
        setDialogOpen(true);
    };

    const handleAddOption = () => {
        setData('options', [
            ...data.options,
            { option_text: '', is_correct: false },
        ]);
    };

    const handleRemoveOption = (index: number) => {
        if (data.options.length > 2) {
            const newOptions = data.options.filter((_, i) => i !== index);
            setData('options', newOptions);
        }
    };

    const handleOptionChange = <K extends keyof QuestionOption>(
        index: number,
        field: K,
        value: QuestionOption[K],
    ) => {
        const newOptions = [...data.options];

        if (field === 'is_correct' && value === true) {
            if (data.question_type === 'multiple_choice') {
                newOptions.forEach((opt, i) => {
                    opt.is_correct = i === index;
                });
            } else {
                newOptions[index] = {
                    ...newOptions[index],
                    is_correct: true,
                };
            }
        } else {
            newOptions[index] = {
                ...newOptions[index],
                [field]: value,
            };
        }

        setData('options', newOptions);
    };

    const handleSave = () => {
        if (editingId) {
            put(`/teacher/questions/${editingId}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    reset();
                },
            });
        } else {
            post(`/teacher/question-banks/${questionBank.id}/questions`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/teacher/questions/${id}`);
    };

    const breadcrumbs = [
        { title: 'Bank Soal', href: '/teacher/question-banks' },
        {
            title: 'Soal Ujian',
            href: `/teacher/question-banks/${questionBank.id}`,
        },
    ];

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
                        {questionBank.questions.length !== 1 ? '' : ''}
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleOpenDialog}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Soal
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Edit Soal' : 'Buat Soal'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">
                                    Soal
                                </label>
                                <Textarea
                                    placeholder="1 + 1 adalah..."
                                    value={data.question_text}
                                    onChange={(e) =>
                                        setData('question_text', e.target.value)
                                    }
                                    className="mt-1"
                                />
                                {errors.question_text && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.question_text}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">
                                        Tipe Soal
                                    </label>
                                    <Select
                                        value={data.question_type}
                                        onValueChange={(val) =>
                                            setData('question_type', val)
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="multiple_choice">
                                                Pilihan Ganda
                                            </SelectItem>
                                            <SelectItem value="multiple_select">
                                                Pilihan Ganda (Beberapa Jawaban)
                                            </SelectItem>
                                            <SelectItem value="true_false">
                                                Benar/Salah
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">
                                        Point
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="45"
                                        value={data.points}
                                        onChange={(e) =>
                                            setData(
                                                'points',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    {errors.points && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.points}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Image URL
                                </label>
                                <Input
                                    placeholder="https://..."
                                    value={data.image_url}
                                    onChange={(e) =>
                                        setData('image_url', e.target.value)
                                    }
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Opsi Jawaban
                                </label>
                                <div className="space-y-2">
                                    {data.options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2"
                                        >
                                            <Input
                                                placeholder={`Opsi ${idx + 1}`}
                                                value={option.option_text}
                                                onChange={(e) =>
                                                    handleOptionChange(
                                                        idx,
                                                        'option_text',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={
                                                    option.is_correct
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    handleOptionChange(
                                                        idx,
                                                        'is_correct',
                                                        !option.is_correct,
                                                    )
                                                }
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            {data.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleRemoveOption(idx)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddOption}
                                    className="mt-2 gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Opsi
                                </Button>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button onClick={handleSave}>
                                    {editingId ? 'Perbarui' : 'Buat Soal'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {questionBank.questions.length > 0 ? (
                    <div className="space-y-4">
                        {questionBank.questions.map((question, idx) => (
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
                                                onClick={() =>
                                                    handleEditQuestion(question)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogTitle>
                                                        Hapus Soal?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Ini tidak dapat
                                                        dibatalkan.
                                                    </AlertDialogDescription>
                                                    <div className="flex gap-2">
                                                        <AlertDialogCancel>
                                                            Batal
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                handleDelete(
                                                                    question.id,
                                                                )
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
                                            src={
                                                question.image_url ||
                                                '/placeholder.svg'
                                            }
                                            alt="Question"
                                            className="h-auto max-w-xs rounded"
                                        />
                                    )}
                                    <div>
                                        <p className="mb-2 text-sm font-medium">
                                            Opsi:
                                        </p>
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
                ) : (
                    <Card className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="mb-4 text-gray-500">Belum ada soal</p>
                            <Button
                                onClick={handleOpenDialog}
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
