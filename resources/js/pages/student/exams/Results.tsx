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
import { ArrowLeft, Download, Trophy } from 'lucide-react';

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
        raw_score: number;
        irt_theta: number | null;
        total_score: number;
        question_block_count?: number;
        total_questions: number;
        completed_at: string | null;
    };
    exam: {
        title: string;
        description: string | null;
        type: 'utbk' | 'tka' | 'cbt';
    };
    questionDetails: QuestionDetail[];
}

export default function Results({ attempt, exam, questionDetails }: Props) {
    const page = usePage<{ auth: { user: { is_pro?: boolean } | null } }>();
    const isPro = !!page.props.auth.user?.is_pro;
    const isCbt = exam.type === 'cbt';
    const blockCount = Number(attempt.question_block_count ?? 0) || 1;
    const rawScore = isCbt ? attempt.raw_score : attempt.raw_score / blockCount;
    const totalScore = isCbt ? attempt.total_score : attempt.total_score / blockCount;
    const percentage =
        totalScore > 0
            ? isCbt
                ? ((rawScore / totalScore) * 100).toFixed(2)
                : Math.round((rawScore / totalScore) * 100).toString()
            : '0';
    const hasIrt = typeof attempt.irt_theta === 'number';

    if (!isPro) {
        return (
            <div className="min-h-screen bg-background px-4 py-8 text-foreground">
                <Head title="Ujian selesai" />
                <div className="container mx-auto max-w-3xl space-y-6">
                    <Link href="/student/dashboard">
                        <Button variant="ghost" className="pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
                        </Button>
                    </Link>
                    <Card className="border-2">
                        <CardContent className="space-y-3 p-8">
                            <h1 className="text-2xl font-bold">Ujian telah selesai</h1>
                            <p className="text-sm text-muted-foreground">
                                Jawaban kamu sudah disimpan. Upgrade akun untuk melihat hasil dan pembahasan lengkap.
                            </p>
                            <Link href="/student/account"><Button>Upgrade ke Pro</Button></Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground">
            <Head title={`Hasil: ${exam.title}`} />
            <div className="container mx-auto max-w-4xl space-y-8">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <Link href="/student/dashboard">
                        <Button variant="ghost" className="pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
                        </Button>
                    </Link>
                    {exam.type !== 'cbt' && <a href={`/student/exams/${attempt.id}/download-pdf`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Unduh Hasil Ujian</Button>
                    </a>}
                </div>

                <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5">
                    <CardContent className="space-y-6 p-8 text-center">
                        <div className="flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"><Trophy className="h-10 w-10 text-primary" /></div></div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
                            <Badge variant="outline">{exam.type.toUpperCase()}</Badge>
                            <p className="text-sm text-muted-foreground">
                                {attempt.completed_at ? `Selesai pada ${new Date(attempt.completed_at).toLocaleDateString('id-ID')}` : 'Ujian selesai'}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
                            <ScoreCard label={hasIrt ? 'Skor IRT (Theta)' : isCbt ? 'Nilai Kamu (poin)' : 'Nilai Kamu'} value={hasIrt ? attempt.irt_theta!.toFixed(2) : Math.floor(rawScore).toString()} />
                            <ScoreCard label={isCbt ? 'Poin Diperoleh / Maksimum' : 'Skor Mentah'} value={`${Math.floor(rawScore)} / ${Math.floor(totalScore)}`} />
                            <ScoreCard label={isCbt ? 'Persentase Nilai' : 'Persentase Benar'} value={`${percentage}%`} />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Rincian Soal</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">Buka soal untuk melihat jawaban kamu dan jawaban benar.</p>
                        </div>
                        <Badge variant="outline">{questionDetails.length} soal</Badge>
                    </div>
                    <Accordion type="single" collapsible className="rounded-lg border px-4">
                        {questionDetails.map((question, index) => (
                            <AccordionItem key={question.id} value={String(question.id)}>
                                <AccordionTrigger className="text-left">
                                    <span className="flex items-center gap-2"><span>Soal {index + 1}</span>{question.is_correct ? <Badge>Benar</Badge> : <Badge variant="destructive">Salah</Badge>}</span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 text-sm">
                                    <p>{question.question_text}</p>
                                    <ResultRow label="Jawaban kamu" value={question.student_answer ?? '-'} />
                                    <ResultRow label="Jawaban benar" value={question.correct_answer ?? '-'} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
    return <div className="rounded-lg border bg-background p-4 shadow-sm"><div className="mb-1 text-sm text-muted-foreground">{label}</div><div className="text-3xl font-bold">{value}</div></div>;
}

function ResultRow({ label, value }: { label: string; value: string }) {
    return <div className={cn('rounded-md border p-3')}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}
