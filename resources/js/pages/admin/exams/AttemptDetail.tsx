import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    FileText,
    XCircle,
} from 'lucide-react';

import { AttemptQuestionList } from '@/components/AttemptQuestionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface QuestionDetail {
    id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    points_earned: number;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        total_score: number;
        irt_theta: number | null;
        irt_block_score: number | null;
        completed_at: string | null;
    };
    exam: {
        id: number;
        name: string;
        description?: string | null;
        irt_processed_at?: string | null;
    };
    questionBankCount: number;
    student: {
        name: string;
        email: string;
        university: { name: string | null } | null;
        major: { name: string | null } | null;
    };
    studentData?: {
        selected_university: string | null;
        selected_major: string | null;
        minimum_passing_grade: number;
    };
    // Controller sends both; skorUtbk is raw (e.g. 692.35) same scale as passingScore
    skorUtbkPct: number | null; // percentage, e.g. 45.41 — display only
    skorUtbk: number | null; // raw UTBK score, e.g. 692.35
    adjustedScore: number; // legacy alias = skorUtbk ?? 0
    passingScore: number; // raw scale, e.g. 651
    isPassed: boolean; // computed raw vs raw in controller
    questionDetails: QuestionDetail[];
    questionPerformance: Record<number, unknown>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
            <span className="shrink-0 text-sm text-muted-foreground">
                {label}
            </span>
            <span className="text-right text-sm font-medium">{value}</span>
        </div>
    );
}

export default function AttemptDetail({
    attempt,
    exam,
    student,
    studentData,
    skorUtbkPct,
    skorUtbk,
    adjustedScore,
    passingScore,
    isPassed,
    questionDetails,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Ujian', href: '/admin/exams' },
        { title: exam.name, href: `/admin/exams/${exam.id}` },
        { title: 'Percobaan', href: `/admin/exams/${exam.id}/attempts` },
        { title: 'Detail', href: '#' },
    ];

    const irtProcessed = !!exam.irt_processed_at;

    // Use raw UTBK score (same scale as passingScore).
    // If controller already sends skorUtbk, use it directly.
    // Otherwise derive from pct: raw = pct * 1525 / 100.
    // adjustedScore may be pct (old controller) or raw (new controller) — don't rely on it.
    const rawScore =
        skorUtbk ??
        (skorUtbkPct !== null ? (skorUtbkPct * 1525) / 100 : adjustedScore);
    const displayPct =
        skorUtbkPct ?? (skorUtbk !== null ? (skorUtbk / 1525) * 100 : null);

    const completedDate = attempt.completed_at
        ? new Date(attempt.completed_at).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '-';

    const university =
        studentData?.selected_university ?? student.university?.name ?? '-';
    const major = studentData?.selected_major ?? student.major?.name ?? '-';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Percobaan — ${exam.name}`} />

            <div className="mx-auto space-y-6 p-4">
                {/* ── Header ── */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Detail Percobaan
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {exam.name} — {student.name}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <Link href={`/admin/exams/${exam.id}/attempts`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        {irtProcessed && (
                            <>
                                <a
                                    href={`/admin/attempts/${attempt.id}/download-pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Unduh PDF
                                    </Button>
                                </a>
                                <a
                                    href={`/admin/attempts/${attempt.id}/download-letter`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Unduh Surat
                                    </Button>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Result Banner ── */}
                <div
                    className={cn(
                        'flex flex-col gap-6 rounded-xl border-2 p-6 md:flex-row md:items-center',
                        isPassed
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-red-500/30 bg-red-500/5',
                    )}
                >
                    {/* Status */}
                    <div className="flex shrink-0 items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
                            {isPassed ? (
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Hasil
                            </p>
                            <p
                                className={cn(
                                    'text-3xl font-bold',
                                    isPassed
                                        ? 'text-green-700'
                                        : 'text-red-600',
                                )}
                            >
                                {isPassed ? 'LULUS' : 'TIDAK LULUS'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Diselesaikan: {completedDate}
                            </p>
                        </div>
                    </div>

                    {/* Score stat boxes */}
                    <div className="flex flex-wrap gap-3 md:ml-auto">
                        {/* Skor UTBK — raw value, directly comparable to Min. Nilai Prodi */}
                        <div className="min-w-[140px] rounded-lg border bg-background px-5 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Skor UTBK
                            </p>
                            {irtProcessed ? (
                                <>
                                    <p className="text-2xl font-bold">
                                        {rawScore.toFixed(2)}
                                    </p>
                                    {displayPct !== null && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {displayPct.toFixed(1)}% dari 1.525
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-base text-muted-foreground">
                                    Belum diproses
                                </p>
                            )}
                        </div>

                        {/* Min. Nilai Prodi — same raw scale */}
                        <div className="min-w-[110px] rounded-lg border bg-background px-5 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Min. Nilai Prodi
                            </p>
                            <p className="text-2xl font-bold">{passingScore}</p>
                        </div>

                        {/* Theta */}
                        {attempt.irt_theta !== null && irtProcessed && (
                            <div className="min-w-[110px] rounded-lg border bg-background px-5 py-3">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                    Theta (IRT)
                                </p>
                                <p className="text-2xl font-bold">
                                    {Number(attempt.irt_theta).toFixed(3)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Info Grid ── */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Informasi Siswa
                        </p>
                        <div className="divide-y overflow-hidden rounded-lg border px-5">
                            <InfoRow label="Nama" value={student.name} />
                            <InfoRow label="Email" value={student.email} />
                            <InfoRow label="Universitas" value={university} />
                            <InfoRow label="Program Studi" value={major} />
                            <InfoRow
                                label="Min. Nilai Prodi"
                                value={passingScore}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Informasi Ujian
                        </p>
                        <div className="divide-y overflow-hidden rounded-lg border px-5">
                            <InfoRow label="Nama Ujian" value={exam.name} />
                            <InfoRow
                                label="Diselesaikan"
                                value={completedDate}
                            />
                            <InfoRow
                                label="Status IRT"
                                value={
                                    irtProcessed ? (
                                        <span className="font-semibold text-green-600">
                                            Sudah Diproses
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-amber-600">
                                            Belum Diproses
                                        </span>
                                    )
                                }
                            />
                            {exam.description && (
                                <InfoRow
                                    label="Deskripsi"
                                    value={exam.description}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Question Breakdown ── */}
                <div>
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Rincian Jawaban
                    </p>
                    <Card>
                        <CardContent className="p-0">
                            <AttemptQuestionList questions={questionDetails} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
