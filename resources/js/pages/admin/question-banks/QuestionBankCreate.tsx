// react
import { Head, useForm } from '@inertiajs/react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
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

// types
import { BreadcrumbItem } from '@/types';

export default function QuestionBankCreate() {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/question-banks');
    };

    const handleCancel = () => {
        window.location.href = '/admin/question-banks';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Bank Soal', href: '/admin/question-banks' },
        { title: 'Buat Bank Soal', href: '/admin/question-banks/create' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Bank Soal" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Buat Bank Soal
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Buat bank soal baru untuk mengorganisir pertanyaan dan
                        penilaian Anda.
                    </p>
                </div>

                <Card className="mx-auto w-full max-w-screen">
                    <CardHeader>
                        <CardTitle>Detail Bank Soal</CardTitle>
                        <CardDescription>
                            Masukkan detail untuk bank soal baru Anda. Kolom
                            yang ditandai dengan * wajib diisi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="e.g., Biologi Bab 5"
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
                                    placeholder="Masukkan deskripsi untuk bank soal ini (opsional)"
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
                                    Opsional: Tambahkan detail tentang topik
                                    yang dibahas atau tujuan dari bank soal ini
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Membuat...'
                                        : 'Buat Bank Soal'}
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
            </div>
        </AppLayout>
    );
}
