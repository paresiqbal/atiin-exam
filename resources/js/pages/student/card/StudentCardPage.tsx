import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    CheckCircle2,
    Download,
    Loader2,
    Trash2,
    Upload,
    User,
    XCircle,
} from 'lucide-react';

type StudentPayload = {
    name: string;
    student_id: string;
    school?: string | null;
    class?: string | null;
    photo_url?: string | null;
};

type PageProps = {
    student: StudentPayload;
    auth: { user: { is_pro: boolean } };
    flash?: { success?: string; error?: string };
};

function initials(name?: string | null) {
    const s = typeof name === 'string' ? name.trim() : '';
    if (!s) return 'S';
    return s
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

function formatStudentId(id: string) {
    return (id ?? '').replace(/\D/g, '').padStart(8, '0');
}

// ── ATTINSEE Student Card ──────────────────────────────────────────────────
function StudentCard({
    student,
    isPro,
    displayPhoto,
    cardRef,
}: {
    student: StudentPayload;
    isPro: boolean;
    displayPhoto?: string;
    cardRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div className="flex justify-center py-4">
            <div
                ref={cardRef}
                className="light relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl"
                style={{
                    aspectRatio: '1.58 / 1',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
            >
                {/* Header */}
                <div className="relative h-24 bg-[#991b1b]">
                    <div className="pointer-events-none absolute inset-0 opacity-15">
                        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,white_0,transparent_40%),radial-gradient(circle_at_80%_0%,white_0,transparent_45%)]" />
                    </div>
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-8 pt-6">
                        <div className="space-y-0.5">
                            <div className="text-[10px] font-bold tracking-[0.3em] text-red-200/80 uppercase">
                                Kartu Identitas Siswa
                            </div>
                            <div className="text-2xl font-black tracking-tighter text-white">
                                ATTIN<span className="text-red-200">SEE</span>
                            </div>
                        </div>
                        <div
                            className={`rounded-full border px-4 py-1 text-[10px] font-bold ${
                                isPro
                                    ? 'border-white/40 bg-white/20 text-white'
                                    : 'border-white/10 bg-black/20 text-red-100'
                            }`}
                        >
                            {isPro ? 'PRO MEMBER' : 'BASIC MEMBER'}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="relative flex h-[calc(100%-96px)] items-center px-8">
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
                        <div className="rotate-[-12deg] text-[110px] font-black italic">
                            ATTINSEE
                        </div>
                    </div>

                    <div className="relative flex w-full items-start gap-8">
                        {/* Photo */}
                        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border-[6px] border-white bg-slate-50 shadow-lg">
                            {displayPhoto ? (
                                <img
                                    src={displayPhoto}
                                    className="h-full w-full object-cover"
                                    crossOrigin="anonymous"
                                    alt="Student"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-200">
                                    {initials(student.name)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col justify-center space-y-3 pt-1">
                            <div>
                                <label className="block text-[8px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                                    Nama Lengkap
                                </label>
                                <div className="truncate text-[18px] leading-tight font-extrabold text-slate-900 uppercase">
                                    {student.name || '—'}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-[#991b1b]">
                                        ID:
                                    </span>
                                    <span className="font-mono text-xs font-bold tracking-widest text-slate-700">
                                        {formatStudentId(student.student_id)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 border-y border-slate-100 py-2">
                                <div>
                                    <label className="block text-[8px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                                        Class
                                    </label>
                                    <div className="text-xs font-bold text-slate-800">
                                        {student.class ?? '—'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[8px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                                        Status
                                    </label>
                                    <div className="text-xs font-bold text-slate-800">
                                        Permanent
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[8px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                                    Sekolah
                                </label>
                                <div className="truncate text-[11px] font-bold text-slate-600">
                                    {student.school || 'NOT SET'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────
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

    const cardRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        photo: File | null;
    }>({ photo: null });

    const displayPhoto = useMemo(
        () => previewUrl ?? student.photo_url ?? undefined,
        [previewUrl, student.photo_url],
    );

    // ── File selection (input or drag-drop) ──────────────────────────────
    const applyFile = (file: File | null) => {
        if (!file) return;

        // Basic client-side validation
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            alert('Format tidak didukung. Gunakan JPG, PNG, atau WebP.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran foto maksimal 2 MB.');
            return;
        }

        setData('photo', file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        applyFile(e.target.files?.[0] ?? null);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        applyFile(e.dataTransfer.files?.[0] ?? null);
    };

    const clearFile = () => {
        setData('photo', null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    // ── Submit ────────────────────────────────────────────────────────────
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

    // ── Download PNG ──────────────────────────────────────────────────────
    const CARD_WIDTH = 680;

    const downloadCard = useCallback(async () => {
        const node = cardRef.current;
        if (!node) return;
        setDownloading(true);

        const prevWidth = node.style.width;
        const prevMinWidth = node.style.minWidth;
        const prevMaxWidth = node.style.maxWidth;
        node.style.width = `${CARD_WIDTH}px`;
        node.style.minWidth = `${CARD_WIDTH}px`;
        node.style.maxWidth = `${CARD_WIDTH}px`;

        await new Promise((r) => setTimeout(r, 80));

        try {
            const { toPng } = await import('html-to-image');
            const cardHeight = node.getBoundingClientRect().height;

            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 3,
                width: CARD_WIDTH,
                height: Math.round(cardHeight),
            });

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `ATTINSEE-ID-${student.student_id || 'CARD'}.png`;
            a.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Gagal mengunduh kartu.');
        } finally {
            node.style.width = prevWidth;
            node.style.minWidth = prevMinWidth;
            node.style.maxWidth = prevMaxWidth;
            setDownloading(false);
        }
    }, [student.student_id]);

    // ── Flash message ─────────────────────────────────────────────────────
    const flash = props.flash;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'ID Card', href: '/student/card' },
            ]}
        >
            <Head title="Student Card" />

            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
                {/* Flash */}
                {(flash?.success || flash?.error) && (
                    <div
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                            flash.error
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-green-200 bg-green-50 text-green-700'
                        }`}
                    >
                        {flash.error ? (
                            <XCircle className="h-4 w-4 shrink-0" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        )}
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Page header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Digital ID Card
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Official identity card for the Attinsee platform.
                        </p>
                    </div>
                    <Badge variant={isPro ? 'destructive' : 'secondary'}>
                        {isPro ? 'Pro' : 'Free'}
                    </Badge>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                    {/* ── Card preview ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                                Live Preview
                            </span>
                            <Button
                                onClick={downloadCard}
                                disabled={downloading}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                            >
                                {downloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Download PNG
                            </Button>
                        </div>

                        <StudentCard
                            student={student}
                            isPro={isPro}
                            displayPhoto={displayPhoto}
                            cardRef={cardRef}
                        />
                    </div>

                    {/* ── Upload panel ── */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Identity Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={submitPhoto}
                                    className="space-y-4"
                                >
                                    {/* Drop zone */}
                                    <div className="space-y-2">
                                        <Label>Change Photo</Label>

                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOver(true);
                                            }}
                                            onDragLeave={() =>
                                                setDragOver(false)
                                            }
                                            onDrop={onDrop}
                                            onClick={() =>
                                                inputRef.current?.click()
                                            }
                                            className={`relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                                                dragOver
                                                    ? 'border-[#991b1b] bg-red-50'
                                                    : previewUrl
                                                      ? 'border-green-400 bg-green-50'
                                                      : 'border-muted-foreground/25 hover:border-[#991b1b]/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <Input
                                                ref={inputRef}
                                                type="file"
                                                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={onPickFile}
                                            />

                                            {previewUrl ? (
                                                /* Show thumbnail when file is selected */
                                                <div className="flex flex-col items-center gap-2">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="h-20 w-20 rounded-lg object-cover shadow"
                                                    />
                                                    <span className="text-xs font-medium text-green-700">
                                                        {data.photo?.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <div className="rounded-full bg-muted p-3">
                                                        <User className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            Klik atau seret foto
                                                            ke sini
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground/70">
                                                            JPG, PNG, WebP —
                                                            maks 2MB
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Validation error */}
                                        {errors.photo && (
                                            <p className="flex items-center gap-1.5 text-xs text-red-600">
                                                <XCircle className="h-3.5 w-3.5" />
                                                {errors.photo}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            type="submit"
                                            disabled={processing || !data.photo}
                                            className="w-full bg-[#991b1b] hover:bg-[#7f1d1d]"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />{' '}
                                                    Save Photo
                                                </>
                                            )}
                                        </Button>

                                        {data.photo && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFile}
                                                className="w-full gap-1.5 text-muted-foreground"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus pilihan
                                            </Button>
                                        )}
                                    </div>
                                </form>

                                {/* Tips */}
                                <div className="mt-4 space-y-1 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                                    <p className="font-semibold">
                                        Tips foto yang baik:
                                    </p>
                                    <ul className="list-disc space-y-0.5 pl-4">
                                        <li>Background polos & terang</li>
                                        <li>Wajah jelas, tidak blur</li>
                                        <li>Posisi lurus, close-up</li>
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
