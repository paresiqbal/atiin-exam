'use client';

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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';

interface QuestionBank {
    id: number;
    name: string;
    description: string | null;
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface Props {
    questionBank: QuestionBank;
}

const createBreadcrumbs = (name: string): BreadcrumbItem[] => {
    return [
        { title: 'Question Banks', href: '/teacher/question-banks' },
        { title: name, href: '#' },
    ];
};

export default function QuestionBankEdit({ questionBank }: Props) {
    const { data, setData, put, errors, processing } = useForm({
        name: questionBank.name,
        description: questionBank.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/teacher/question-banks/${questionBank.id}`);
    };

    const handleCancel = () => {
        window.location.href = '/teacher/question-banks';
    };

    const handleDelete = () => {
        router.delete(`/teacher/question-banks/${questionBank.id}`);
    };

    const breadcrumbs = createBreadcrumbs(questionBank.name);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${questionBank.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Edit Question Bank
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Update the details of your question bank.
                    </p>
                </div>

                {/* Form Card */}
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Question Bank Details</CardTitle>
                        <CardDescription>
                            Modify the question bank information below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description Field */}
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
                                            ? 'border-destructive'
                                            : ''
                                    }
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Delete Section */}
                <Card className="w-full max-w-2xl border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Permanently delete this question bank and all
                            associated data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete Question Bank
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogTitle>
                                    Delete Question Bank
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {questionBank.name}"? This action cannot be
                                    undone and will remove all associated
                                    questions.
                                </AlertDialogDescription>
                                <div className="flex gap-3">
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
