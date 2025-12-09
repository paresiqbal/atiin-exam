import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    questionBank: {
        id: number;
        name: string;
    };
}

export default function CreateQuestion({ questionBank }: Props) {
    const [optionsCount, setOptionsCount] = useState(2);
    const { data, setData, post, errors, processing } = useForm({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        image_url: '',
        options: Array(2)
            .fill(null)
            .map((_, i) => ({
                option_text: '',
                is_correct: i === 0,
            })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/question-banks/${questionBank.id}/questions`);
    };

    const addOption = () => {
        setData('options', [
            ...data.options,
            { option_text: '', is_correct: false },
        ]);
        setOptionsCount(optionsCount + 1);
    };

    const removeOption = (index: number) => {
        if (data.options.length > 2) {
            setData(
                'options',
                data.options.filter((_, i) => i !== index),
            );
            setOptionsCount(optionsCount - 1);
        }
    };

    const updateOption = (index: number, field: string, value: any) => {
        const newOptions = [...data.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setData('options', newOptions);
    };

    const breadcrumbs = [
        { title: 'Question Banks', href: '/admin/question-banks' },
        {
            title: questionBank.name,
            href: `/admin/question-banks/${questionBank.id}`,
        },
        {
            title: 'Questions',
            href: `/admin/question-banks/${questionBank.id}/questions`,
        },
        { title: 'Create', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Soal" />

            <div className="flex max-w-4xl flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">Buat Soal</h1>
                    <p className="mt-1 text-gray-600">
                        Tambahkan soal baru ke {questionBank.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Question Text */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Detail Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="question_text">Soal *</Label>
                                <Textarea
                                    id="question_text"
                                    placeholder="Masukkan soal Anda di sini..."
                                    value={data.question_text}
                                    onChange={(e) =>
                                        setData('question_text', e.target.value)
                                    }
                                    className="mt-2 min-h-24"
                                />
                                {errors.question_text && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.question_text}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="question_type">
                                        Tipe Soal *
                                    </Label>
                                    <Select
                                        value={data.question_type}
                                        onValueChange={(value) =>
                                            setData('question_type', value)
                                        }
                                    >
                                        <SelectTrigger
                                            id="question_type"
                                            className="mt-2"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="multiple_choice">
                                                Pilihan Ganda
                                            </SelectItem>
                                            <SelectItem value="multiple_select">
                                                Pilihan Ganda (Multiple Select)
                                            </SelectItem>
                                            <SelectItem value="true_false">
                                                Benar/Salah
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.question_type && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.question_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="points">Point *</Label>
                                    <Input
                                        id="points"
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
                                        className="mt-2"
                                    />
                                    {errors.points && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.points}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="image_url">
                                        URL Gambar (Opsional)
                                    </Label>
                                    <Input
                                        id="image_url"
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={data.image_url}
                                        onChange={(e) =>
                                            setData('image_url', e.target.value)
                                        }
                                        className="mt-2"
                                    />
                                    {errors.image_url && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.image_url}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Opsi Jawaban
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.options.map((option, index) => (
                                <div
                                    key={index}
                                    className="flex items-end gap-3"
                                >
                                    <div className="flex-1 space-y-2">
                                        <Label
                                            htmlFor={`option-${index}`}
                                            className="text-sm"
                                        >
                                            Opsi {index + 1}
                                        </Label>
                                        <Input
                                            id={`option-${index}`}
                                            placeholder={`Enter option ${index + 1}...`}
                                            value={option.option_text}
                                            onChange={(e) =>
                                                updateOption(
                                                    index,
                                                    'option_text',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`correct-${index}`}
                                            checked={option.is_correct}
                                            onCheckedChange={(checked) =>
                                                updateOption(
                                                    index,
                                                    'is_correct',
                                                    checked,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={`correct-${index}`}
                                            className="cursor-pointer text-sm"
                                        >
                                            Benar
                                        </Label>
                                    </div>
                                    {data.options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeOption(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            {errors.options && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {errors.options}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addOption}
                                className="mt-4 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Opsi
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={`/admin/question-banks/${questionBank.id}/questions`}
                        >
                            <Button variant="outline">Batal</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Buat Soal
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
