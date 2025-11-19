import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Head, useForm } from '@inertiajs/react';

interface QuestionBank {
    id: number;
    name: string;
}

interface ExamSettings {
    time_limit_minutes: number;
    shuffle_questions: boolean;
    allow_review: boolean;
}

interface ExamData {
    id: number;
    name: string;
    description: string;
    question_bank_id: number;
    settings: ExamSettings;
}

interface Props {
    exam: ExamData;
    questionBanks: QuestionBank[];
}

export default function EditExam({ exam, questionBanks }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: exam.name,
        description: exam.description || '',
        question_bank_id: exam.question_bank_id.toString(),
        time_limit_minutes: exam.settings.time_limit_minutes.toString(),
        shuffle_questions: exam.settings.shuffle_questions,
        allow_review: exam.settings.allow_review,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/exams/${exam.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Exams', href: '/admin/exams' },
                { title: 'Edit', href: `/admin/exams/${exam.id}/edit` },
            ]}
        >
            <Head title="Edit Exam" />
            <div className="p-4">
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Edit Exam</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Exam Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={
                                        errors.name ? 'border-red-500' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className={
                                        errors.description
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Question Bank */}
                            <div className="space-y-2">
                                <Label htmlFor="question_bank_id">
                                    Question Bank *
                                </Label>
                                <Select
                                    value={data.question_bank_id}
                                    onValueChange={(value) =>
                                        setData('question_bank_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="question_bank_id"
                                        className={
                                            errors.question_bank_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questionBanks.map((qb) => (
                                            <SelectItem
                                                key={qb.id}
                                                value={qb.id.toString()}
                                            >
                                                {qb.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.question_bank_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.question_bank_id}
                                    </p>
                                )}
                            </div>

                            {/* Time Limit */}
                            <div className="space-y-2">
                                <Label htmlFor="time_limit_minutes">
                                    Time Limit (minutes) *
                                </Label>
                                <Input
                                    id="time_limit_minutes"
                                    type="number"
                                    min="1"
                                    max="300"
                                    value={data.time_limit_minutes}
                                    onChange={(e) =>
                                        setData(
                                            'time_limit_minutes',
                                            e.target.value,
                                        )
                                    }
                                    className={
                                        errors.time_limit_minutes
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.time_limit_minutes && (
                                    <p className="text-sm text-red-500">
                                        {errors.time_limit_minutes}
                                    </p>
                                )}
                            </div>

                            {/* Toggle Options */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Shuffle Questions</Label>
                                    <input
                                        type="checkbox"
                                        checked={data.shuffle_questions}
                                        onChange={(e) =>
                                            setData(
                                                'shuffle_questions',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-5 w-5"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Allow Review</Label>
                                    <input
                                        type="checkbox"
                                        checked={data.allow_review}
                                        onChange={(e) =>
                                            setData(
                                                'allow_review',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-5 w-5"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {processing ? 'Updating...' : 'Update Exam'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
