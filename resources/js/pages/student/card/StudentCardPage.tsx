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
    const s = (name ?? '').trim();
    if (!s) return 'S';
    const parts = s.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join('');
}

function formatStudentId(id: string) {
    // Optional: make it look "ID-ish"
    // e.g. 00012345
    const only = (id ?? '').replace(/\D/g, '');
    return only.padStart(8, '0');
}

export default function StudentCardPage() {
    const { props } = usePage<PageProps>();
    const student = props.student;
    const isPro = !!props.auth?.user?.is_pro;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        photo: File | null;
    }>({
        photo: null,
    });

    const displayPhoto = useMemo(() => {
        if (previewUrl) return previewUrl;
        return student.photo_url ?? undefined;
    }, [previewUrl, student.photo_url]);

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
                // cleanup preview
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                reset('photo');

                // clear native input value so you can re-upload same file
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/student/dashboard' },
        { title: 'Kartu Siswa', href: '/student/card' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kartu Siswa" />

            <div className="mx-auto w-full max-w-5xl space-y-6">
                {(props.flash?.success || props.flash?.error) && (
                    <Alert>
                        <AlertTitle>Info</AlertTitle>
                        <AlertDescription>
                            {props.flash?.success ?? props.flash?.error}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Kartu Siswa
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Upload foto dan gunakan kartu ini sebagai identitas
                            di Attin.
                        </p>
                    </div>

                    <Badge
                        variant={isPro ? 'default' : 'secondary'}
                        className="h-7"
                    >
                        {isPro ? 'PRO' : 'FREE'}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                    {/* The Card (KTP-style) */}
                    <Card className="overflow-hidden">
                        {/* top strip */}
                        <div className="relative">
                            <div className="h-16 bg-primary" />
                            {/* subtle pattern */}
                            <div className="pointer-events-none absolute inset-0 opacity-10">
                                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0%,white_0,transparent_45%),radial-gradient(circle_at_80%_90%,white_0,transparent_45%)]" />
                            </div>

                            <div className="absolute top-6 left-6">
                                <Badge
                                    className="border border-primary/20 bg-background text-primary"
                                    variant="secondary"
                                >
                                    ATTIN STUDENT ID
                                </Badge>
                            </div>

                            <div className="absolute top-6 right-6">
                                <Badge
                                    className="border border-white/20 bg-white/15 text-white"
                                    variant="secondary"
                                >
                                    {isPro ? 'PRO MEMBER' : 'BASIC MEMBER'}
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="relative p-6">
                            {/* watermark */}
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="text-6xl font-bold tracking-widest text-primary/5 select-none">
                                    ATTIN
                                </div>
                            </div>

                            <div className="relative flex gap-5">
                                <div className="flex flex-col items-center gap-3">
                                    <Avatar className="h-28 w-28 border">
                                        <AvatarImage src={displayPhoto} />
                                        <AvatarFallback>
                                            {initials(student.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="text-center">
                                        <div className="text-xs text-muted-foreground">
                                            Foto Siswa
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            (jpg/png/webp)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">
                                            NAMA LENGKAP
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {student.name}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground">
                                                STUDENT ID
                                            </div>
                                            <div className="font-mono text-sm">
                                                {formatStudentId(
                                                    student.student_id,
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground">
                                                KELAS
                                            </div>
                                            <div className="text-sm">
                                                {student.class ?? '—'}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <div className="text-xs font-medium text-muted-foreground">
                                                SEKOLAH
                                            </div>
                                            <div className="text-sm">
                                                {student.school ?? '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <div className="text-xs text-muted-foreground">
                                                Kartu ini dibuat otomatis oleh
                                                sistem Attin.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Upload / Ganti Foto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={submitPhoto} className="space-y-4">
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
                                        Maksimal 2MB. Disarankan foto close-up,
                                        terang, dan rapi.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.photo}
                                    >
                                        {processing
                                            ? 'Uploading...'
                                            : 'Simpan Foto'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={processing}
                                        onClick={() => {
                                            setData('photo', null);
                                            if (previewUrl)
                                                URL.revokeObjectURL(previewUrl);
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
                                    Tips
                                </div>
                                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                    <li>Gunakan background polos.</li>
                                    <li>
                                        Wajah terlihat jelas (tanpa filter
                                        berlebihan).
                                    </li>
                                    <li>Posisi foto lurus, tidak miring.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
