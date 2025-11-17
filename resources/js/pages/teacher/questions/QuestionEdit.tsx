import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    question: Question;
    questionBank: {
        id: number;
        name: string;
    };
}

export default function EditQuestion({ question, questionBank }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const {
        data,
        setData,
        put,
        delete: destroy,
        errors,
        processing,
    } = useForm({
        question_text: question.question_text,
        question_type: question.question_type,
        points: question.points,
        image_url: question.image_url || '',
        options: question.options.map((o) => ({
            option_text: o.option_text,
            is_correct: o.is_correct,
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(
            `/teacher/question-banks/${questionBank.id}/questions/${question.id}`,
        );
    };

    const handleDelete = () => {
        destroy(
            `/teacher/question-banks/${questionBank.id}/questions/${question.id}`,
        );
    };

    const addOption = () => {
        setData('options', [
            ...data.options,
            { option_text: '', is_correct: false },
        ]);
    };

    const removeOption = (index: number) => {
        if (data.options.length > 2) {
            setData(
                'options',
                data.options.filter((_, i) => i !== index),
            );
        }
    };

    const updateOption = (index: number, field: string, value: any) => {
        const newOptions = [...data.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setData('options', newOptions);
    };

    const breadcrumbs = [
        { title: 'Question Banks', href: '/teacher/question-banks' },
        {
            title: questionBank.name,
            href: `/teacher/question-banks/${questionBank.id}`,
        },
        {
            title: 'Questions',
            href: `/teacher/question-banks/${questionBank.id}/questions`,
        },
        { title: 'Edit', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Question" />

            <div className="flex max-w-4xl flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit Question
                    </h1>
                    <p className="mt-1 text-gray-600">
                        Update question in {questionBank.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Question Text */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Question Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="question_text">
                                    Question *
                                </Label>
                                <Textarea
                                    id="question_text"
                                    placeholder="Enter your question here..."
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
                                        Question Type *
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
                                                Multiple Choice
                                            </SelectItem>
                                            <SelectItem value="multiple_select">
                                                Multiple Select
                                            </SelectItem>
                                            <SelectItem value="true_false">
                                                True/False
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
                                    <Label htmlFor="points">Points *</Label>
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
                                        Image URL (Optional)
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
                                Answer Options
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
                                            Option {index + 1}
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
                                            Correct
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
                                Add Option
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={`/teacher/question-banks/${questionBank.id}/questions`}
                        >
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Update Question
                        </Button>
                    </div>
                </form>

                {/* Delete Section */}
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-lg text-red-900">
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-red-700">
                            Once you delete a question, there is no going back.
                            Please be certain.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete Question
                        </Button>
                    </CardContent>
                </Card>

                {/* Delete Confirmation */}
                <AlertDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
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
                                onClick={handleDelete}
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
