import { Head, Link, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type Consultant = {
    id: number;
    name: string;
    email?: string;
};

type FormData = {
    consultant_id: string;
    topic: string;
    message: string;
    preferred_date: string; // YYYY-MM-DD
};

export default function Create({ consultants }: { consultants: Consultant[] }) {
    const { data, setData, post, processing, errors, reset } =
        useForm<FormData>({
            consultant_id: '',
            topic: '',
            message: '',
            preferred_date: '',
        });

    const selectedDate = React.useMemo(() => {
        if (!data.preferred_date) return undefined;
        const d = new Date(data.preferred_date);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }, [data.preferred_date]);

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

                        {/* Topic (Textarea) */}
                        <div className="space-y-2">
                            <Label>Topik</Label>
                            <Textarea
                                value={data.topic}
                                onChange={(e) =>
                                    setData('topic', e.target.value)
                                }
                                placeholder="Contoh: Pemilihan jurusan, strategi belajar, dll"
                                rows={3}
                            />
                            {errors.topic && (
                                <p className="text-sm text-destructive">
                                    {errors.topic}
                                </p>
                            )}
                        </div>

                        {/* Preferred date (shadcn calendar) */}
                        <div className="space-y-2">
                            <Label>Tanggal preferensi (opsional)</Label>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={`w-full justify-start gap-2 text-left font-normal ${
                                            errors.preferred_date
                                                ? 'border-destructive'
                                                : ''
                                        }`}
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        {selectedDate ? (
                                            <span>
                                                {format(
                                                    selectedDate,
                                                    'dd MMMM yyyy',
                                                    {
                                                        locale: id,
                                                    },
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Pilih tanggal
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            if (!date) {
                                                setData('preferred_date', '');
                                                return;
                                            }
                                            const yyyy = date.getFullYear();
                                            const mm = String(
                                                date.getMonth() + 1,
                                            ).padStart(2, '0');
                                            const dd = String(
                                                date.getDate(),
                                            ).padStart(2, '0');
                                            setData(
                                                'preferred_date',
                                                `${yyyy}-${mm}-${dd}`,
                                            );
                                        }}
                                        initialFocus
                                    />

                                    {/* Optional: clear button */}
                                    <div className="border-t p-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() =>
                                                setData('preferred_date', '')
                                            }
                                        >
                                            Hapus tanggal
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

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
