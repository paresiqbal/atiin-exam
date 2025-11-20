// react
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

// components
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Check, Plus, X } from 'lucide-react';

// types
import type { Question, QuestionOption } from '@/types/question';

interface QuestionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questionBankId: number;
    editingQuestion: Question | null;
}

type FormData = {
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_select' | 'true_false';
    points: number;
    image_url: string;
    options: QuestionOption[];
};

export function QuestionFormDialog({
    open,
    onOpenChange,
    questionBankId,
    editingQuestion,
}: QuestionFormDialogProps) {
    const { data, setData, post, put, reset, errors } = useForm<FormData>({
        question_text: '',
        question_type: 'multiple_choice',
        points: 5,
        image_url: '',
        options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ],
    });

    useEffect(() => {
        if (!open) return;

        if (editingQuestion) {
            setData({
                question_text: editingQuestion.question_text,
                question_type: editingQuestion.question_type,
                points: editingQuestion.points,
                image_url: editingQuestion.image_url || '',
                options: editingQuestion.options,
            });
        } else {
            reset();
            setData('options', [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editingQuestion]);

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
                // only 1 correct answer
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
        if (editingQuestion) {
            put(`/teacher/questions/${editingQuestion.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post(`/teacher/question-banks/${questionBankId}/questions`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingQuestion ? 'Edit Soal' : 'Buat Soal'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Question text */}
                    <div>
                        <label className="text-sm font-medium">Soal</label>
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

                    {/* Type & points */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">
                                Tipe Soal
                            </label>
                            <Select
                                value={data.question_type}
                                onValueChange={(val) =>
                                    setData(
                                        'question_type',
                                        val as FormData['question_type'],
                                    )
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
                            <label className="text-sm font-medium">Point</label>
                            <Input
                                type="number"
                                min="1"
                                max="45"
                                value={data.points}
                                onChange={(e) =>
                                    setData('points', Number(e.target.value))
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

                    {/* Image URL (later can be replaced with uploader) */}
                    <div>
                        <label className="text-sm font-medium">Image URL</label>
                        <Input
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) =>
                                setData('image_url', e.target.value)
                            }
                            className="mt-1"
                        />
                    </div>

                    {/* Options */}
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
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSave}>
                            {editingQuestion ? 'Perbarui' : 'Buat Soal'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
