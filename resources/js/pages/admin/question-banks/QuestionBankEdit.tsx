// react
import { Head, router, useForm } from '@inertiajs/react';

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

// icons
import { Trash2 } from 'lucide-react';

// types
import { BreadcrumbItem } from '@/types';

interface QuestionBank {
    id: number;
    name: string;
    description: string | null;
}

interface Props {
    questionBank: QuestionBank;
}

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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Bank Soal', href: '/teacher/question-banks' },
        {
            title: 'Edit Bank Soal',
            href: `/teacher/question-banks/${questionBank.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${questionBank.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Edit Bank Soal
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Ubah informasi bank soal Anda di bawah ini.
                    </p>
                </div>

                <Card className="mx-auto w-full max-w-screen">
                    <CardHeader>
                        <CardTitle>Detail Bank Soal</CardTitle>
                        <CardDescription>
                            Ubah informasi bank soal di bawah ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama{' '}
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

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
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

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Perubahan'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Delete Section */}
                <Card className="w-full max-w-2xl border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            Zona Berbahaya
                        </CardTitle>
                        <CardDescription>
                            Hapus permanen bank soal ini beserta semua data
                            terkait.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Hapus Bank Soal
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogTitle>
                                    Hapus Bank Soal
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus "
                                    {questionBank.name}"? Tindakan ini tidak
                                    dapat dibatalkan dan akan menghapus semua
                                    soal terkait.
                                </AlertDialogDescription>
                                <div className="flex gap-3">
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Hapus
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
