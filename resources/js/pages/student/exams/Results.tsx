import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Download,
    Trophy,
    XCircle,
} from 'lucide-react';

interface QuestionDetail {
    id: number;
    question_text: string;
    question_type: string;
    points: number;
    student_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    points_earned: number;
}

interface Major {
    id: number;
    name: string;
    minimum_passing_grade: number;
}

interface University {
    id: number;
    name: string;
    city?: string | null;
}

interface UniversitySelection {
    university: University;
    majors: Major[];
}

interface StudentPlacement {
    university: University | null;
    major: Major | null;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        total_score: number;
        total_questions: number;
        completed_at: string;
    };
    exam: {
        title: string;
        description: string;
    };
    passingScore: number;
    isPassed: boolean;
    questionDetails: QuestionDetail[];
    studentPlacement?: StudentPlacement;
    studentSelections?: StudentPlacement[];
    universitySelections?: UniversitySelection[];
}

export default function Results({
    attempt,
    exam,
    passingScore,
    isPassed,
    questionDetails,
    studentPlacement,
    studentSelections,
    universitySelections = [],
}: Props) {
    const page = usePage<{ auth: { user: { is_pro?: boolean } | null } }>();
    const isPro = !!page.props.auth.user?.is_pro;

    const totalQuestions = Number(attempt.total_questions ?? 0);
    const percentage =
        totalQuestions > 0
            ? Math.round((attempt.score / totalQuestions) * 100)
            : 0;

    // Fallback untuk kompatibilitas
    const placements: StudentPlacement[] = (
        studentSelections && studentSelections.length > 0
            ? studentSelections
            : studentPlacement
              ? [studentPlacement]
              : []
    ).filter((p) => p && p.university && p.major) as StudentPlacement[];

    const hasPlacementInfo =
        placements.length > 0 || universitySelections.length > 0;

    const mainMessage = isPassed
        ? 'Selamat! Kamu mencapai nilai minimal untuk jurusan yang dipilih.'
        : 'Kamu belum mencapai nilai minimal untuk jurusan yang dipilih.';

    // =========================
    // REGULAR VIEW (LOCKED)
    // =========================
    if (!isPro) {
        return (
            <div className="min-h-screen bg-background px-4 py-8 text-foreground">
                <Head title="Ujian selesai" />

                <div className="container mx-auto max-w-3xl space-y-6">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <Link href="/student/dashboard">
                            <Button
                                variant="ghost"
                                className="pl-0 transition-all hover:pl-2"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Dashboard
                            </Button>
                        </Link>

                        <Link href="/student/account">
                            <Button>Upgrade ke Pro</Button>
                        </Link>
                    </div>

                    <Card className="border-2">
                        <CardContent className="space-y-3 p-8">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Ujian telah selesai
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Terima kasih, jawaban kamu sudah berhasil
                                disimpan.
                            </p>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold">
                                            Hasil lengkap tersedia untuk akun
                                            Pro
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Upgrade untuk melihat detail nilai,
                                            status lulus/tidak, rincian jawaban
                                            per soal, rekomendasi universitas &
                                            jurusan, serta unduh PDF hasil.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Link href="/student/account">
                                    <Button>Upgrade ke Pro</Button>
                                </Link>
                                <Link href="/student/dashboard">
                                    <Button variant="outline">Kembali</Button>
                                </Link>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Jika kamu merasa ini keliru, silakan hubungi
                                admin atau coba refresh halaman.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // =========================
    // PRO VIEW (FULL RESULTS)
    // =========================
    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground">
            <Head title={`Hasil: ${exam.title}`} />

            <div className="container mx-auto max-w-4xl space-y-8">
                {/* Header / Back + Actions */}
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <Link href="/student/dashboard">
                        <Button
                            variant="ghost"
                            className="pl-0 transition-all hover:pl-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Dashboard
                        </Button>
                    </Link>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/student/exams/${attempt.id}/download-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Unduh Hasil Ujian
                            </Button>
                        </a>

                        <Link href="/student/universities">
                            <Button variant="default">
                                Lihat universitas lainnya
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Score Card */}
                <Card
                    className={cn(
                        'overflow-hidden border-2',
                        isPassed
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-destructive/20 bg-destructive/5',
                    )}
                >
                    <CardContent className="space-y-6 p-8 text-center">
                        <div className="flex justify-center">
                            {isPassed ? (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {exam.title}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Badge
                                    variant={
                                        isPassed ? 'default' : 'destructive'
                                    }
                                    className="px-4 py-1 text-lg"
                                >
                                    {isPassed ? 'LULUS' : 'TIDAK LULUS'}
                                </Badge>
                                <span className="text-muted-foreground">
                                    Selesai pada{' '}
                                    {new Date(
                                        attempt.completed_at,
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    isPassed
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-destructive',
                                )}
                            >
                                {mainMessage}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Nilai Kamu
                                </div>
                                <div className="text-3xl font-bold">
                                    {attempt.score}{' '}
                                    <span className="text-base font-normal text-muted-foreground">
                                        / {totalQuestions}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Persentase
                                </div>
                                <div
                                    className={cn(
                                        'text-3xl font-bold',
                                        isPassed
                                            ? 'text-green-600'
                                            : 'text-destructive',
                                    )}
                                >
                                    {percentage}%
                                </div>
                            </div>
                            <div className="rounded-lg border bg-background p-4 shadow-sm">
                                <div className="mb-1 text-sm text-muted-foreground">
                                    Nilai Kelulusan Minimal
                                </div>
                                <div className="text-3xl font-bold">
                                    {passingScore}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* University Selections - New Format */}
                {universitySelections.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Hasil Pilihan Universitas & Jurusan Kamu
                        </h2>

                        {universitySelections.map((selection, uniIndex) => {
                            const uni = selection.university;

                            return (
                                <Card
                                    key={`uni-${uni.id}-${uniIndex}`}
                                    className="border-2"
                                >
                                    <CardContent className="p-6">
                                        <div className="mb-4 border-b pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge
                                                        variant="outline"
                                                        className="mb-2"
                                                    >
                                                        Pilihan Universitas{' '}
                                                        {uniIndex + 1}
                                                    </Badge>
                                                    <h3 className="text-xl font-bold">
                                                        {uni.name}
                                                    </h3>
                                                    {uni.city && (
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            📍 {uni.city}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Jurusan yang dipilih (
                                                {selection.majors.length}):
                                            </div>

                                            {selection.majors.map(
                                                (major, majorIndex) => {
                                                    const passedForThisMajor =
                                                        attempt.score >=
                                                        major.minimum_passing_grade;

                                                    const globalIndex =
                                                        universitySelections
                                                            .slice(0, uniIndex)
                                                            .reduce(
                                                                (sum, sel) =>
                                                                    sum +
                                                                    sel.majors
                                                                        .length,
                                                                0,
                                                            ) +
                                                        majorIndex +
                                                        1;

                                                    return (
                                                        <div
                                                            key={`major-${major.id}-${majorIndex}`}
                                                            className={cn(
                                                                'rounded-lg border-2 p-4 transition-colors',
                                                                passedForThisMajor
                                                                    ? 'border-green-500/30 bg-green-500/5'
                                                                    : 'border-muted bg-muted/30',
                                                            )}
                                                        >
                                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                                <div className="flex-1">
                                                                    <div className="mb-1 flex items-center gap-2">
                                                                        <Badge
                                                                            variant={
                                                                                passedForThisMajor
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }
                                                                            className="text-xs"
                                                                        >
                                                                            Pilihan{' '}
                                                                            {
                                                                                globalIndex
                                                                            }
                                                                        </Badge>
                                                                        {passedForThisMajor ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        ) : (
                                                                            <XCircle className="h-4 w-4 text-muted-foreground" />
                                                                        )}
                                                                    </div>
                                                                    <div className="text-base font-semibold">
                                                                        {
                                                                            major.name
                                                                        }
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="mb-1 text-xs text-muted-foreground">
                                                                        Nilai
                                                                        minimal
                                                                    </div>
                                                                    <div className="text-2xl font-bold">
                                                                        {
                                                                            major.minimum_passing_grade
                                                                        }
                                                                    </div>
                                                                    <div
                                                                        className={cn(
                                                                            'mt-1 text-xs font-medium',
                                                                            passedForThisMajor
                                                                                ? 'text-green-600 dark:text-green-400'
                                                                                : 'text-destructive',
                                                                        )}
                                                                    >
                                                                        {passedForThisMajor
                                                                            ? '✓ Memenuhi syarat'
                                                                            : '✗ Belum memenuhi syarat'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <div className="flex justify-center pt-2">
                            <Link href="/student/universities">
                                <Button variant="outline" size="lg">
                                    Cari universitas & jurusan lain yang mungkin
                                    kamu lolos
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Fallback - Old Format */}
                {universitySelections.length === 0 && hasPlacementInfo && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Hasil pilihan universitas & jurusan
                        </h2>

                        {placements.map((placement, index) => {
                            const uni = placement.university!;
                            const major = placement.major!;
                            const passedForThisMajor =
                                attempt.score >= major.minimum_passing_grade;

                            return (
                                <Card
                                    key={`${uni.id}-${major.id}-${index}`}
                                    className="border border-muted"
                                >
                                    <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">
                                                Pilihan {index + 1}
                                            </div>
                                            <div className="mt-1 text-lg font-semibold">
                                                {major.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                di{' '}
                                                <span className="font-medium">
                                                    {uni.name}
                                                </span>
                                                {uni.city && <> · {uni.city}</>}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                Nilai minimal jurusan ini
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {major.minimum_passing_grade}
                                            </div>
                                            <div
                                                className={cn(
                                                    'mt-1 text-xs font-medium',
                                                    passedForThisMajor
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-destructive',
                                                )}
                                            >
                                                {passedForThisMajor
                                                    ? 'Kamu memenuhi syarat untuk masuk jurusan ini berdasarkan nilai ujian.'
                                                    : 'Kamu belum memenuhi syarat untuk masuk jurusan ini berdasarkan nilai ujian.'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Rincian Soal */}
                <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Rincian Soal
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Tap soal untuk melihat jawaban kamu & jawaban
                                benar.
                            </p>
                        </div>

                        <Badge variant="outline" className="shrink-0 text-xs">
                            {questionDetails.length} soal
                        </Badge>
                    </div>

                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-2"
                    >
                        {questionDetails.map((q, index) => {
                            const statusText = q.is_correct ? 'BENAR' : 'SALAH';

                            return (
                                <AccordionItem
                                    key={q.id}
                                    value={`q-${q.id}`}
                                    className="rounded-lg border bg-card px-3 shadow-sm"
                                >
                                    <AccordionTrigger className="py-3 hover:no-underline">
                                        <div className="flex w-full items-start gap-2.5 text-left">
                                            <div className="mt-0.5">
                                                {q.is_correct ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold">
                                                        Soal {index + 1}
                                                    </span>

                                                    <Badge
                                                        variant={
                                                            q.is_correct
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                        className="h-5 px-2 text-[10px]"
                                                    >
                                                        {statusText}
                                                    </Badge>
                                                </div>

                                                <div
                                                    className="prose prose-sm dark:prose-invert mt-1 line-clamp-2 max-w-none text-xs text-muted-foreground [&_img]:hidden [&_p]:my-1"
                                                    dangerouslySetInnerHTML={{
                                                        __html: q.question_text,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="pb-3">
                                        <div className="space-y-3">
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div
                                                    className={cn(
                                                        'rounded-md border p-3',
                                                        q.is_correct
                                                            ? 'border-green-500/25 bg-green-500/5'
                                                            : 'border-yellow-500/25 bg-yellow-500/5',
                                                    )}
                                                >
                                                    <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                                                        Jawaban Kamu
                                                    </div>

                                                    {q.student_answer ? (
                                                        <div
                                                            className="prose prose-sm dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border [&_p]:my-2"
                                                            dangerouslySetInnerHTML={{
                                                                __html: q.student_answer,
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground italic">
                                                            Belum menjawab.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="rounded-md border border-green-500/25 bg-green-500/5 p-3">
                                                    <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                                                        Jawaban Benar
                                                    </div>

                                                    <div
                                                        className="prose prose-sm dark:prose-invert max-w-none text-green-700 dark:text-green-300 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border [&_p]:my-2"
                                                        dangerouslySetInnerHTML={{
                                                            __html: q.correct_answer,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
