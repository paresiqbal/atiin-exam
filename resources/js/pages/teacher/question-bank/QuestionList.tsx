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
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface QuestionBank {
    id: number;
    name: string;
    description: string | null;
    questions_count: number;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    questionBanks: {
        data: QuestionBank[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: PaginationLink[];
    };
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

const createBreadcrumbs = (): BreadcrumbItem[] => {
    return [{ title: 'Question Banks', href: '/teacher/question-banks' }];
};

export default function QuestionBankIndex({ questionBanks }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBanks = questionBanks.data.filter(
        (bank) =>
            bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleEdit = (id: number) => {
        router.get(`/teacher/question-banks/${id}/edit`);
    };

    const handleDelete = (id: number) => {
        router.delete(`/teacher/question-banks/${id}`);
    };

    const handleCreate = () => {
        router.get('/teacher/question-banks/create');
    };

    const handlePageChange = (page: number) => {
        router.get(`/teacher/question-banks?page=${page}`);
    };

    const breadcrumbs = createBreadcrumbs();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Banks" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Question Banks
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your question banks and organize your questions
                        effectively.
                    </p>
                </div>

                {/* Search and Create Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search question banks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Question Bank
                    </Button>
                </div>

                {/* Question Banks Grid */}
                {filteredBanks.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredBanks.map((bank) => (
                            <Card
                                key={bank.id}
                                className="flex flex-col justify-between"
                            >
                                <CardHeader>
                                    <CardTitle className="line-clamp-2">
                                        {bank.name}
                                    </CardTitle>
                                    {bank.description && (
                                        <CardDescription className="line-clamp-2">
                                            {bank.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>
                                            {bank.questions_count} question
                                            {bank.questions_count !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                        <span>
                                            {new Date(
                                                bank.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(bank.id)}
                                            className="flex-1 gap-2"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="flex-1 gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogTitle>
                                                    Delete Question Bank
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to
                                                    delete "{bank.name}"? This
                                                    action cannot be undone.
                                                </AlertDialogDescription>
                                                <div className="flex gap-3">
                                                    <AlertDialogCancel>
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            handleDelete(
                                                                bank.id,
                                                            )
                                                        }
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </div>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="mb-4 text-muted-foreground">
                                No question banks found
                            </p>
                            <Button onClick={handleCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Question Bank
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Pagination */}
                {questionBanks.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {questionBanks.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (link.url) {
                                        const page = new URLSearchParams(
                                            new URL(link.url).search,
                                        ).get('page');
                                        if (page)
                                            handlePageChange(parseInt(page));
                                    }
                                }}
                                disabled={!link.url}
                                className="min-w-9"
                            >
                                {link.label
                                    .replace(/&laquo;/, '«')
                                    .replace(/&raquo;/, '»')}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
