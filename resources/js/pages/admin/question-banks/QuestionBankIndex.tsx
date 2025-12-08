// react
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

// layouts
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// icons
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

// types
import { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { QuestionBank } from '@/types/question-bank';

interface Props {
    questionBanks: Paginated<QuestionBank>;
}

export default function QuestionBankIndex({ questionBanks }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBanks = questionBanks.data.filter(
        (bank) =>
            bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleEdit = (id: number) => {
        router.get(`/admin/question-banks/${id}/edit`);
    };

    const handleDelete = (id: number) => {
        router.delete(`/admin/question-banks/${id}`);
    };

    const handleCreate = () => {
        router.get('/admin/question-banks/create');
    };

    const handlePageChange = (page: number) => {
        router.get(`/admin/question-banks?page=${page}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Bank Soal', href: '/admin/question-banks' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Banks" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Bank Soal
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Buat soal ujian dan kelola bank soal kamu di sini.
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari bank soal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Buat Bank Soal
                    </Button>
                </div>

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
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>
                                            {bank.questions_count} soal
                                            {bank.questions_count !== 1
                                                ? ''
                                                : ''}
                                        </span>
                                        <span>
                                            {new Date(
                                                bank.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                router.get(
                                                    `/teacher/question-banks/${bank.id}`,
                                                )
                                            }
                                            className="flex-1"
                                        >
                                            Detail
                                        </Button>
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
                                                    Hapus
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogTitle>
                                                    Hapus Bank Soal
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Apakah Anda yakin ingin
                                                    menghapus "{bank.name}"?
                                                    Tindakan ini tidak dapat
                                                    dibatalkan.
                                                </AlertDialogDescription>
                                                <div className="flex gap-3">
                                                    <AlertDialogCancel>
                                                        Batal
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            handleDelete(
                                                                bank.id,
                                                            )
                                                        }
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Hapus
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
                                Tidak ada bank soal ditemukan.
                            </p>
                            <Button onClick={handleCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Buat Bank Soal Pertama Anda
                            </Button>
                        </div>
                    </Card>
                )}

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
