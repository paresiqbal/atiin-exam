import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { ExamQuestionList } from '@/components/ExamQuestionList';
import type { Question } from '@/types/question';
import { CalendarRange, Clock, RefreshCw, Users } from 'lucide-react';

interface ExamToken {
    token: string;
}

interface ExamSettings {
    time_limit_minutes: number;
    shuffle_questions: boolean;
    allow_review: boolean;
}

interface ExamQuestionBankPivot {
    duration_minutes: number;
    sort_order: number;
}

interface QuestionBank {
    id: number;
    name: string;
    pivot: ExamQuestionBankPivot;
    questions: Question[];
}

interface ExamData {
    id: number;
    name: string;
    description: string | null;
    is_published: boolean;
    start_at: string;
    end_at: string;
    attempts_count: number;
    created_at?: string | null;

    school?: { id: number; name: string } | null;
    settings: ExamSettings | null;

    // ✅ NEW: array
    question_banks: QuestionBank[];

    tokens: ExamToken[];
}

interface Props {
    exam: ExamData;
}

function formatDateTime(value: string) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('id-ID');
}

export default function ShowExam({ exam }: Props) {
    const [copiedToken, setCopiedToken] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const sortedBanks = useMemo(() => {
        const banks = exam.question_banks ?? [];
        return [...banks].sort((a, b) => {
            const ao = a.pivot?.sort_order ?? 999999;
            const bo = b.pivot?.sort_order ?? 999999;
            if (ao !== bo) return ao - bo;
            return a.id - b.id;
        });
    }, [exam.question_banks]);

    const questions = useMemo(() => {
        // gabung semua question dari semua bank (urut mengikuti sort_order)
        const all = sortedBanks.flatMap((b) => b.questions ?? []);

        // dedupe kalau ada question yang kebetulan sama (safety)
        const seen = new Set<number>();
        const out: Question[] = [];

        for (const q of all) {
            const id = (q as unknown as { id?: number }).id;
            if (typeof id === 'number') {
                if (seen.has(id)) continue;
                seen.add(id);
            }
            out.push(q);
        }

        return out;
    }, [sortedBanks]);

    const totalMinutesFromBanks = useMemo(() => {
        return sortedBanks.reduce((sum, b) => {
            const m = Number(b.pivot?.duration_minutes) || 0;
            return sum + m;
        }, 0);
    }, [sortedBanks]);

    const statusInfo = useMemo(() => {
        const now = new Date();
        const start = new Date(exam.start_at);
        const end = new Date(exam.end_at);

        if (now < start) {
            return {
                label: 'Belum dimulai',
                colorClass:
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
            };
        }

        if (now > end) {
            return {
                label: 'Sudah berakhir',
                colorClass:
                    'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
            };
        }

        return {
            label: 'Sedang berlangsung',
            colorClass:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        };
    }, [exam.start_at, exam.end_at]);

    const handleCopyToken = () => {
        if (exam.tokens[0]) {
            navigator.clipboard.writeText(exam.tokens[0].token);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const handlePublish = () => {
        router.post(
            `/admin/exams/${exam.id}/publish`,
            {},
            { preserveScroll: true },
        );
    };

    const handleRegenerateToken = () => {
        setRegenerating(true);
        router.post(
            `/admin/exams/${exam.id}/regenerate-token`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRegenerating(false),
            },
        );
    };

    const handleEndExam = () => {
        router.post(`/admin/exams/${exam.id}/end`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin Dashboard', href: '/admin/dashboard' },
                { title: 'Daftar Ujian', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
            ]}
        >
            <Head title={exam.name} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">{exam.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {exam.description || (
                                <span className="italic">
                                    Tidak ada deskripsi ujian.
                                </span>
                            )}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                                className={
                                    exam.is_published
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                }
                            >
                                {exam.is_published ? 'Published' : 'Draft'}
                            </Badge>

                            <Badge className={statusInfo.colorClass}>
                                {statusInfo.label}
                            </Badge>

                            {exam.school && (
                                <span>
                                    Sekolah:{' '}
                                    <span className="font-medium">
                                        {exam.school.name}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/admin/exams/${exam.id}/attempts`}>
                            <Button variant="outline">Lihat Percobaan</Button>
                        </Link>

                        <Link href={`/admin/exams/${exam.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>

                        {!exam.is_published && (
                            <Button
                                onClick={handlePublish}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Terbitkan
                            </Button>
                        )}

                        {statusInfo.label !== 'Sudah berakhir' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        Akhiri Ujian
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Akhiri ujian sekarang?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ujian akan langsung ditutup. Siswa
                                            tidak bisa melanjutkan ujian yang
                                            masih berjalan.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Batal
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleEndExam}
                                        >
                                            Akhiri Ujian
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>

                {/* Top summary cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Schedule */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <CalendarRange className="h-4 w-4" />
                                Jadwal Ujian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Mulai
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(exam.start_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Berakhir
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(exam.end_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings / duration */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4" />
                                Durasi & Pengaturan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {exam.settings ? (
                                <>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Batas Waktu (Total)
                                        </p>
                                        <p className="font-medium">
                                            {exam.settings.time_limit_minutes}{' '}
                                            menit
                                        </p>

                                        {totalMinutesFromBanks > 0 &&
                                            exam.settings.time_limit_minutes !==
                                                totalMinutesFromBanks && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total dari bank soal:{' '}
                                                    {totalMinutesFromBanks}{' '}
                                                    menit
                                                </p>
                                            )}
                                    </div>

                                    <div className="flex gap-4 text-xs">
                                        <div>
                                            <p className="text-muted-foreground">
                                                Acak soal
                                            </p>
                                            <p className="font-semibold">
                                                {exam.settings.shuffle_questions
                                                    ? 'Ya'
                                                    : 'Tidak'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">
                                                Izinkan review
                                            </p>
                                            <p className="font-semibold">
                                                {exam.settings.allow_review
                                                    ? 'Ya'
                                                    : 'Tidak'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Tidak ada pengaturan yang dikonfigurasi.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attendance */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Users className="h-4 w-4" />
                                Kehadiran
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Jumlah percobaan / peserta
                            </p>
                            <p className="text-3xl font-bold">
                                {exam.attempts_count}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Token card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle>Token Ujian</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 items-center gap-2">
                            <code className="flex-1 rounded bg-muted px-3 py-2 text-center text-2xl font-extrabold tracking-[0.3em] text-primary">
                                {exam.tokens[0]?.token ||
                                    'Tidak ada token tersedia'}
                            </code>

                            {exam.tokens[0] && (
                                <Button
                                    variant="outline"
                                    onClick={handleCopyToken}
                                >
                                    {copiedToken ? 'Disalin!' : 'Copy'}
                                </Button>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-2 inline-flex items-center gap-2 md:mt-0"
                            onClick={handleRegenerateToken}
                            disabled={regenerating}
                        >
                            <RefreshCw
                                className={
                                    'h-4 w-4 ' +
                                    (regenerating ? 'animate-spin' : '')
                                }
                            />
                            {regenerating
                                ? 'Mengganti token...'
                                : 'Regenerate Token'}
                        </Button>
                    </CardContent>
                </Card>

                {/* NEW: Question Banks section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bank Soal ({sortedBanks.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {sortedBanks.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Tidak ada bank soal terhubung.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {sortedBanks.map((b, idx) => (
                                    <div
                                        key={b.id}
                                        className="flex flex-col justify-between gap-2 rounded-md border p-3 md:flex-row md:items-center"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {idx + 1}. {b.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {b.questions?.length ?? 0} soal
                                            </div>
                                        </div>

                                        <Badge className="bg-primary text-primary-foreground">
                                            {b.pivot?.duration_minutes ?? 0}{' '}
                                            menit
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                            <span className="text-xs text-muted-foreground">
                                Total durasi dari bank soal
                            </span>
                            <Badge className="bg-primary text-primary-foreground">
                                {totalMinutesFromBanks} menit
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Section (flattened) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pertanyaan ({questions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExamQuestionList questions={questions} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
