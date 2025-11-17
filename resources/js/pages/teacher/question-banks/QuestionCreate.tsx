'use client';

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
import { Head, useForm } from '@inertiajs/react';

interface BreadcrumbItem {
    title: string;
    href: string;
}

const createBreadcrumbs = (): BreadcrumbItem[] => {
    return [
        { title: 'Question Banks', href: '/teacher/question-banks' },
        { title: 'Create', href: '/teacher/question-banks/create' },
    ];
};

export default function QuestionBankCreate() {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/teacher/question-banks');
    };

    const handleCancel = () => {
        window.location.href = '/teacher/question-banks';
    };

    const breadcrumbs = createBreadcrumbs();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Question Bank" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Create Question Bank
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create a new question bank to organize your questions
                        and assessments.
                    </p>
                </div>

                {/* Form Card */}
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Question Bank Details</CardTitle>
                        <CardDescription>
                            Enter the details for your new question bank. Fields
                            marked with * are required.
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
                                    placeholder="e.g., Biology Chapter 5"
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
                                    placeholder="Enter a description for this question bank (optional)"
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
                                <p className="text-xs text-muted-foreground">
                                    Optional: Add details about the topics
                                    covered or purpose of this bank
                                </p>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Question Bank'}
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
            </div>
        </AppLayout>
    );
}
