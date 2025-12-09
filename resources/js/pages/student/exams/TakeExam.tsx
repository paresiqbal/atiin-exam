import { QuestionMap } from '@/components/QuestionMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'multiple_select';
    points: number;
    options: Option[];
}

interface AttemptProps {
    id: number;
    exam_id: number;
    status: string; // e.g. 'in_progress' | 'submitted'
    is_frozen: boolean;
}

interface ExamSettings {
    time_limit_minutes: number;
}

interface ExamProps {
    title: string;
    description: string;
    settings: ExamSettings;
}

interface LogViolationResponse {
    success?: boolean;
    is_frozen?: boolean;
    message?: string;
    violation_count?: number;
    max_violations?: number;
    count?: number;
}

interface Props {
    attempt: AttemptProps;
    exam: ExamProps;
    questions: Question[];
    responses: Record<number, number>;
    timeLimit: number;
    elapsedMinutes: number;
}

export default function TakeExam({
    attempt,
    exam,
    questions,
    responses,
    timeLimit,
    elapsedMinutes,
}: Props) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>(
        responses || {},
    );
    const [timeLeft, setTimeLeft] = useState(
        Math.max(0, timeLimit * 60 - Math.floor(elapsedMinutes) * 60),
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);

    const submitRef = useRef(false);

    const hasQuestions = Array.isArray(questions) && questions.length > 0;
    const currentQuestion = hasQuestions
        ? questions[currentQuestionIndex]
        : null;
    const progress = hasQuestions
        ? ((currentQuestionIndex + 1) / questions.length) * 100
        : 0;

    // Countdown timer + auto-submit when time runs out
    useEffect(() => {
        if (timeLeft <= 0 && !submitRef.current) {
            submitRef.current = true;
            router.post(`/student/exams/${attempt.id}/submit`);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, attempt.id]);

    // Anti-cheat: detect tab switch / leaving page
    useEffect(() => {
        const DEFAULT_MAX_WARNINGS = 3;

        const handleVisibilityChange = async () => {
            if (document.hidden && attempt.status === 'in_progress') {
                try {
                    const response = await fetch(
                        `/student/exams/${attempt.id}/log-violation`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN':
                                    document
                                        .querySelector(
                                            'meta[name="csrf-token"]',
                                        )
                                        ?.getAttribute('content') || '',
                            },
                            body: JSON.stringify({
                                violation_type: 'tab_switch',
                            }),
                        },
                    );

                    const raw = await response.text();

                    if (!response.ok) {
                        console.error(
                            'log-violation failed:',
                            response.status,
                            raw,
                        );
                        return;
                    }

                    let parsed: unknown;
                    try {
                        parsed = JSON.parse(raw);
                    } catch {
                        console.error('Response is not JSON:', raw);
                        return;
                    }

                    if (typeof parsed !== 'object' || parsed === null) {
                        console.error('Unexpected response shape:', parsed);
                        return;
                    }

                    const data = parsed as LogViolationResponse;

                    if (data.is_frozen) {
                        alert(data.message || 'Ujian Anda dibekukan.');
                        window.location.reload();
                    } else {
                        const violationCount =
                            data.violation_count ?? data.count ?? 0;
                        const maxWarnings =
                            data.max_violations ?? DEFAULT_MAX_WARNINGS;

                        alert(
                            `⚠️ PERINGATAN ${violationCount}/${maxWarnings}: Jangan keluar dari halaman ujian! Ujian akan dibekukan jika terus keluar.`,
                        );
                    }
                } catch (error) {
                    console.error('Error logging violation:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [attempt.id, attempt.status]);

    const handleOptionSelect = (optionId: string) => {
        if (!currentQuestion) return;

        const id = parseInt(optionId, 10);

        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: id,
        }));

        axios
            .post(`/student/exams/${attempt.id}/save-answer`, {
                question_id: currentQuestion.id,
                selected_option_id: id,
            })
            .catch(() => {
                console.error('Failed to save answer');
            });
    };

    const handleSubmit = () => {
        if (!hasQuestions) return;

        const answeredIds = Object.keys(answers).map(Number);
        const totalQuestions = questions.length;
        const totalAnswered = answeredIds.length;
        const diff = totalQuestions - totalAnswered;

        setUnansweredCount(diff);
        setConfirmOpen(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const confirmSubmit = () => {
        if (submitRef.current) return;
        submitRef.current = true;
        router.post(`/student/exams/${attempt.id}/submit`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Head title={`Taking Exam: ${exam.title}`} />

            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-card">
                <div className="mx-auto w-full max-w-3xl px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold">{exam.title}</h1>
                            {hasQuestions && (
                                <p className="text-sm text-muted-foreground">
                                    Question {currentQuestionIndex + 1} of{' '}
                                    {questions.length}
                                </p>
                            )}
                        </div>

                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-lg font-medium',
                                timeLeft < 300
                                    ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                    : 'bg-secondary text-secondary-foreground',
                            )}
                        >
                            <Clock className="h-5 w-5" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    {hasQuestions && (
                        <Progress value={progress} className="mt-4 h-2" />
                    )}
                </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
                {!hasQuestions ? (
                    <Card className="mx-auto max-w-lg">
                        <CardHeader>
                            <CardTitle>Ujian belum memiliki soal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Ujian ini belum memiliki soal yang aktif.
                                Silakan hubungi pengawas atau admin untuk
                                memastikan soal sudah dibuat.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    currentQuestion && (
                        <Card className="border-2">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-lg leading-relaxed">
                                        <div
                                            className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                            dangerouslySetInnerHTML={{
                                                __html: currentQuestion.question_text,
                                            }}
                                        />
                                    </CardTitle>

                                    <span className="rounded bg-secondary px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground">
                                        {currentQuestion.points} poin
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <RadioGroup
                                    value={
                                        answers[
                                            currentQuestion.id
                                        ]?.toString() || ''
                                    }
                                    onValueChange={handleOptionSelect}
                                    className="space-y-3"
                                >
                                    {currentQuestion.options.map((option) => (
                                        <div
                                            key={option.id}
                                            onClick={() =>
                                                handleOptionSelect(
                                                    option.id.toString(),
                                                )
                                            }
                                            className={cn(
                                                'flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-all hover:bg-accent',
                                                answers[currentQuestion.id] ===
                                                    option.id
                                                    ? 'border-primary bg-accent ring-1 ring-primary'
                                                    : 'border-input',
                                            )}
                                        >
                                            <RadioGroupItem
                                                value={option.id.toString()}
                                                id={`option-${option.id}`}
                                                className="pointer-events-none mt-1"
                                            />

                                            <div className="flex-1">
                                                <div
                                                    className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                    dangerouslySetInnerHTML={{
                                                        __html: option.option_text,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    )
                )}
            </main>

            {/* Footer Navigation */}
            {hasQuestions && (
                <footer className="sticky bottom-0 border-t bg-card p-4">
                    <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                    Math.max(0, prev - 1),
                                )
                            }
                            disabled={currentQuestionIndex === 0}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Sebelumnya
                        </Button>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                className="bg-green-600 text-white hover:bg-green-700"
                            >
                                Kirim Ujian
                            </Button>
                        ) : (
                            <Button
                                onClick={() =>
                                    setCurrentQuestionIndex((prev) =>
                                        Math.min(
                                            questions.length - 1,
                                            prev + 1,
                                        ),
                                    )
                                }
                            >
                                Lanjut
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </footer>
            )}

            {hasQuestions && (
                <QuestionMap
                    questions={questions}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    onJump={(index) => setCurrentQuestionIndex(index)}
                />
            )}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {unansweredCount > 0
                                ? 'Beberapa pertanyaan belum terjawab'
                                : 'Kirim Ujian?'}
                        </DialogTitle>

                        <DialogDescription>
                            {unansweredCount > 0
                                ? `Kamu masih punya ${unansweredCount} soal yang belum terjawab. Yakin ingin mengirim?`
                                : 'Kamu sudah menjawab semua pertanyaan. Siap untuk mengirim?'}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Batal
                        </Button>

                        <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={confirmSubmit}
                        >
                            Ya, Kirim Ujian
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
