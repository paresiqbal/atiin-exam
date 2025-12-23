import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type Consultant = {
    id: number;
    name: string;
    email?: string;
};

export default function Create({ consultants }: { consultants: Consultant[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        consultant_id: '',
        topic: '',
        message: '',
        preferred_date: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/student/consultant-requests', {
            preserveScroll: true,
            onSuccess: () => reset('topic', 'message', 'preferred_date'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                {
                    title: 'Konsultasi',
                    href: '/student/consultant-requests',
                },
                { title: 'Buat Request', href: '#' },
            ]}
        >
            <Head title="Buat Request Konsultasi" />

            <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold">
                        Request Konsultasi
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Isi form ini untuk mengajukan konsultasi. Admin akan
                        memproses request kamu.
                    </p>
                </div>

                <Card className="p-4 md:p-6">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Consultant */}
                        <div className="space-y-2">
                            <Label>Pilih Konsultan (Guru)</Label>
                            <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={data.consultant_id}
                                onChange={(e) =>
                                    setData('consultant_id', e.target.value)
                                }
                            >
                                <option value="">-- Pilih guru --</option>
                                {consultants.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                        {c.email ? ` (${c.email})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.consultant_id && (
                                <p className="text-sm text-destructive">
                                    {errors.consultant_id}
                                </p>
                            )}
                        </div>

                        {/* Topic */}
                        <div className="space-y-2">
                            <Label>Topik</Label>
                            <Input
                                value={data.topic}
                                onChange={(e) =>
                                    setData('topic', e.target.value)
                                }
                                placeholder="Contoh: Pemilihan jurusan, strategi belajar, dll"
                            />
                            {errors.topic && (
                                <p className="text-sm text-destructive">
                                    {errors.topic}
                                </p>
                            )}
                        </div>

                        {/* Preferred date */}
                        <div className="space-y-2">
                            <Label>Tanggal preferensi (opsional)</Label>
                            <Input
                                type="date"
                                value={data.preferred_date}
                                onChange={(e) =>
                                    setData('preferred_date', e.target.value)
                                }
                            />
                            {errors.preferred_date && (
                                <p className="text-sm text-destructive">
                                    {errors.preferred_date}
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label>Pesan / Detail (opsional)</Label>
                            <Textarea
                                value={data.message}
                                onChange={(e) =>
                                    setData('message', e.target.value)
                                }
                                placeholder="Jelaskan kebutuhan kamu..."
                                rows={5}
                            />
                            {errors.message && (
                                <p className="text-sm text-destructive">
                                    {errors.message}
                                </p>
                            )}
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <Alert>
                                <AlertDescription>
                                    Ada field yang belum benar. Cek pesan error
                                    di atas.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex items-center justify-between gap-2">
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/student/consultant-requests">
                                    Kembali
                                </Link>
                            </Button>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
