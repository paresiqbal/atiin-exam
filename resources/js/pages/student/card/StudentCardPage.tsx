import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type StudentPayload = {
    name: string;
    student_id: string;
    school?: string | null;
    class?: string | null;
    photo_url?: string | null;
};

type PageProps = {
    student: StudentPayload;
    auth: {
        user: {
            is_pro: boolean;
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

function initials(name?: string | null) {
    const s = typeof name === 'string' ? name.trim() : '';
    if (!s) return 'S';
    const parts = s.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join('');
}

function formatStudentId(id: string) {
    const only = (id ?? '').replace(/\D/g, '');
    return only.padStart(8, '0');
}

export default function StudentCardPage() {
    const { props } = usePage<PageProps>();
    const student = props.student ?? {
        name: '',
        student_id: '',
        school: null,
        class: null,
        photo_url: null,
    };
    const isPro = !!props.auth?.user?.is_pro;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        photo: File | null;
    }>({ photo: null });

    const displayPhoto = useMemo(() => {
        if (previewUrl) return previewUrl;
        return student.photo_url ?? undefined;
    }, [previewUrl, student.photo_url]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/student/dashboard' },
        { title: 'Kartu Siswa', href: '/student/card' },
    ];

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('photo', file);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const submitPhoto = (e: React.FormEvent) => {
        e.preventDefault();

        post('/student/card/photo', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                reset('photo');
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kartu Siswa" />

            <div className="w-full">
                <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
                    {(props.flash?.success || props.flash?.error) && (
                        <Alert>
                            <AlertTitle>Info</AlertTitle>
                            <AlertDescription>
                                {props.flash?.success ?? props.flash?.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Header row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Kartu Siswa
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Upload foto untuk menampilkan kartu siswa kamu.
                            </p>
                        </div>

                        <Badge
                            variant={isPro ? 'default' : 'secondary'}
                            className="h-7 w-fit"
                        >
                            {isPro ? 'PRO' : 'FREE'}
                        </Badge>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                        {/* Card Preview */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-muted-foreground">
                                Preview
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
                                {/* Top ribbon */}
                                <div className="relative">
                                    <div className="h-20 bg-primary" />
                                    {/* soft shine */}
                                    <div className="pointer-events-none absolute inset-0 opacity-15">
                                        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,white_0,transparent_40%),radial-gradient(circle_at_80%_0%,white_0,transparent_45%),radial-gradient(circle_at_70%_120%,white_0,transparent_50%)]" />
                                    </div>

                                    {/* Header text */}
                                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-5">
                                        <div className="space-y-1">
                                            <div className="text-xs font-semibold tracking-widest text-primary-foreground/90">
                                                KARTU IDENTITAS SISWA
                                            </div>
                                            <div className="text-sm font-medium text-primary-foreground">
                                                ATTIN EXAM APP
                                            </div>
                                        </div>

                                        <Badge
                                            className="border border-white/20 bg-white/15 text-white"
                                            variant="secondary"
                                        >
                                            {isPro
                                                ? 'PRO MEMBER'
                                                : 'BASIC MEMBER'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="relative p-6">
                                    {/* Watermark */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="text-[88px] font-bold tracking-[0.25em] text-primary/5 select-none">
                                            ATTIN
                                        </div>
                                    </div>

                                    <div className="relative flex gap-5">
                                        <div className="flex flex-col items-center gap-3">
                                            <Avatar className="h-28 w-28 border bg-background">
                                                <AvatarImage
                                                    src={displayPhoto}
                                                />
                                                <AvatarFallback>
                                                    {initials(student.name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="rounded-full border px-3 py-1 text-[11px] text-muted-foreground">
                                                ID:{' '}
                                                {formatStudentId(
                                                    student.student_id,
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-4">
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-medium text-muted-foreground">
                                                    NAMA
                                                </div>
                                                <div className="truncate text-lg font-semibold">
                                                    {student.name || '—'}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <div className="text-[11px] font-medium text-muted-foreground">
                                                        KELAS
                                                    </div>
                                                    <div className="text-sm">
                                                        {student.class ?? '—'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-[11px] font-medium text-muted-foreground">
                                                        STATUS
                                                    </div>
                                                    <div className="text-sm">
                                                        {isPro ? 'Pro' : 'Free'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 sm:col-span-2">
                                                    <div className="text-[11px] font-medium text-muted-foreground">
                                                        SEKOLAH
                                                    </div>
                                                    <div className="text-sm">
                                                        {student.school ?? '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom strip */}
                                <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-3">
                                    <div className="text-[11px] text-muted-foreground">
                                        Valid saat digunakan di platform Attin
                                    </div>
                                    <div className="text-[11px] font-medium text-muted-foreground">
                                        attin.app
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Tip: gunakan foto close-up supaya terlihat
                                profesional.
                            </p>
                        </div>

                        {/* Upload panel */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Upload / Ganti Foto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form
                                    onSubmit={submitPhoto}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="photo">Foto</Label>
                                        <Input
                                            ref={inputRef}
                                            id="photo"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={onPickFile}
                                        />
                                        {errors.photo && (
                                            <p className="text-sm text-destructive">
                                                {errors.photo}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Maks 2MB (jpg/png/webp). Foto
                                            close-up lebih bagus.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            type="submit"
                                            disabled={processing || !data.photo}
                                            className="w-full"
                                        >
                                            {processing
                                                ? 'Uploading...'
                                                : 'Simpan Foto'}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={processing}
                                            className="w-full"
                                            onClick={() => {
                                                setData('photo', null);
                                                if (previewUrl)
                                                    URL.revokeObjectURL(
                                                        previewUrl,
                                                    );
                                                setPreviewUrl(null);
                                                if (inputRef.current)
                                                    inputRef.current.value = '';
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </form>

                                <div className="rounded-lg border p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Tips Foto
                                    </div>
                                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                        <li>Background polos & terang.</li>
                                        <li>Wajah jelas, tidak blur.</li>
                                        <li>Posisi lurus (tidak miring).</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
