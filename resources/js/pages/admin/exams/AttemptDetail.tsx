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
    adjustedScore: number; // = irt_block_score (skor_utbk_pct) from controller
    passingScore: number;
    isPassed: boolean;
    questionDetails: QuestionDetail[];
    questionPerformance: Record<number, unknown>;
}

// Simple key-value row used in info sections
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

    // adjustedScore is skor_utbk_pct (e.g. 42.35), passingScore is on the same scale
    const skorUtbkPct = adjustedScore;
    const skorUtbkRaw = (skorUtbkPct / 100) * 1525;

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
                    {/* Status icon + label */}
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

                    {/* Score stats */}
                    <div className="flex flex-wrap gap-3 md:ml-auto">
                        <div className="min-w-[110px] rounded-lg border bg-background px-5 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Skor UTBK
                            </p>
                            <p className="text-2xl font-bold">
                                {irtProcessed ? (
                                    `${skorUtbkPct.toFixed(2)}%`
                                ) : (
                                    <span className="text-base text-muted-foreground">
                                        Belum diproses
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="min-w-[110px] rounded-lg border bg-background px-5 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Skor UTBK (Raw)
                            </p>
                            <p className="text-2xl font-bold">
                                {irtProcessed ? (
                                    skorUtbkRaw.toFixed(2)
                                ) : (
                                    <span className="text-base text-muted-foreground">
                                        Belum diproses
                                    </span>
                                )}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                / 1.525
                            </p>
                        </div>

                        <div className="min-w-[110px] rounded-lg border bg-background px-5 py-3">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Passing Grade
                            </p>
                            <p className="text-2xl font-bold">{passingScore}</p>
                        </div>

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
                    {/* Student info — plain section, no card */}
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
                                label="Passing Grade"
                                value={passingScore}
                            />
                        </div>
                    </div>

                    {/* Exam info */}
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
