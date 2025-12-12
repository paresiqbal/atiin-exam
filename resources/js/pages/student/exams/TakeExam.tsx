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
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flag,
    Menu,
    X,
} from 'lucide-react';
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
    status: string;
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

interface Props {
    attempt: AttemptProps;
    exam: ExamProps;
    questions: Question[];
    responses: Record<number, number>;
    timeLimit: number;
    elapsedMinutes: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ToastType = 'warning' | 'error' | 'success';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
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
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
        new Set(),
    );
    const [timeLeft, setTimeLeft] = useState(
        Math.max(0, timeLimit * 60 - Math.floor(elapsedMinutes) * 60),
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [showQuestionNav, setShowQuestionNav] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const submitRef = useRef(false);
    const toastIdRef = useRef(0);

    const hasQuestions = Array.isArray(questions) && questions.length > 0;
    const currentQuestion = hasQuestions
        ? questions[currentQuestionIndex]
        : null;
    const answeredCount = Object.keys(answers).length;
    const progress = hasQuestions
        ? (answeredCount / questions.length) * 100
        : 0;

    // Toast helper
    const showToast = (message: string, type: ToastType = 'warning') => {
        const id = toastIdRef.current++;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

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

    // Time warnings
    useEffect(() => {
        if (timeLeft === 600) {
            // 10 minutes
            showToast('⏰ Waktu tersisa 10 menit!', 'warning');
        } else if (timeLeft === 300) {
            // 5 minutes
            showToast('⚠️ Waktu tersisa 5 menit!', 'error');
        } else if (timeLeft === 60) {
            // 1 minute
            showToast('🚨 Waktu tersisa 1 menit!', 'error');
        }
    }, [timeLeft]);

    // Anti-cheat: detect tab switch
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

                    const data = await response.json();

                    if (data.is_frozen) {
                        showToast(data.message || 'Ujian dibekukan!', 'error');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        const violationCount =
                            data.violation_count ?? data.count ?? 0;
                        const maxWarnings =
                            data.max_violations ?? DEFAULT_MAX_WARNINGS;
                        showToast(
                            `⚠️ PERINGATAN ${violationCount}/${maxWarnings}: Jangan keluar dari halaman ujian!`,
                            'warning',
                        );
                    }
                } catch (error) {
                    console.error('Error logging violation:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () =>
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
    }, [attempt.id, attempt.status]);

    const handleOptionSelect = async (optionId: string) => {
        if (!currentQuestion) return;

        const id = parseInt(optionId, 10);

        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: id,
        }));

        setSaveStatus('saving');

        try {
            await axios.post(`/student/exams/${attempt.id}/save-answer`, {
                question_id: currentQuestion.id,
                selected_option_id: id,
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        } catch {
            setSaveStatus('error');
            showToast('Gagal menyimpan jawaban', 'error');
        }
    };

    const handleClearAnswer = () => {
        if (!currentQuestion) return;

        setAnswers((prev) => {
            const next = { ...prev };
            delete next[currentQuestion.id];
            return next;
        });

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
    };

    const toggleFlag = () => {
        if (!currentQuestion) return;

        setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(currentQuestion.id)) {
                next.delete(currentQuestion.id);
            } else {
                next.add(currentQuestion.id);
            }
            return next;
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

    const jumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setShowQuestionNav(false);
    };

    const isAnswered = (questionId: number) => questionId in answers;
    const isFlagged = (questionId: number) => flaggedQuestions.has(questionId);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title={`Taking Exam: ${exam.title}`} />

            {/* Compact Header */}
            <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <div className="mx-auto w-full max-w-5xl px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Title & Progress */}
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-base font-bold md:text-lg">
                                {exam.title}
                            </h1>
                            <div className="mt-1 flex items-center gap-3">
                                <p className="text-xs text-muted-foreground md:text-sm">
                                    {currentQuestionIndex + 1}/
                                    {questions.length}
                                </p>
                                <p className="text-xs font-medium text-primary md:text-sm">
                                    {answeredCount}/{questions.length} terjawab
                                </p>
                            </div>
                        </div>

                        {/* Right: Timer & Menu */}
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-2 py-1.5 font-mono text-sm font-medium md:gap-2 md:px-4 md:py-2 md:text-lg',
                                    timeLeft < 300
                                        ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                        : timeLeft < 600
                                          ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200'
                                          : 'bg-secondary',
                                )}
                            >
                                <Clock className="h-3 w-3 md:h-5 md:w-5" />
                                <span className="tabular-nums">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setShowQuestionNav(!showQuestionNav)
                                }
                                className="md:hidden"
                            >
                                {showQuestionNav ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={progress} className="mt-3 h-1.5" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-4xl px-4 py-6">
                        {!hasQuestions ? (
                            <Card className="mx-auto max-w-lg">
                                <CardHeader>
                                    <CardTitle>
                                        Ujian belum memiliki soal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Ujian ini belum memiliki soal yang
                                        aktif. Silakan hubungi pengawas.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            currentQuestion && (
                                <div className="space-y-4">
                                    {/* Question Card */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <CardTitle className="flex-1 text-base leading-relaxed md:text-lg">
                                                    <div
                                                        className="prose prose-sm dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg"
                                                        dangerouslySetInnerHTML={{
                                                            __html: currentQuestion.question_text,
                                                        }}
                                                    />
                                                </CardTitle>

                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium whitespace-nowrap">
                                                        {currentQuestion.points}{' '}
                                                        poin
                                                    </span>
                                                    <Button
                                                        variant={
                                                            isFlagged(
                                                                currentQuestion.id,
                                                            )
                                                                ? 'default'
                                                                : 'ghost'
                                                        }
                                                        size="sm"
                                                        onClick={toggleFlag}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Flag
                                                            className={cn(
                                                                'h-4 w-4',
                                                                isFlagged(
                                                                    currentQuestion.id,
                                                                ) &&
                                                                    'fill-current',
                                                            )}
                                                        />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Save Status */}
                                            {saveStatus !== 'idle' && (
                                                <div className="mt-3 flex items-center gap-2 text-sm">
                                                    {saveStatus ===
                                                        'saving' && (
                                                        <span className="text-muted-foreground">
                                                            Menyimpan...
                                                        </span>
                                                    )}
                                                    {saveStatus === 'saved' && (
                                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Tersimpan
                                                        </span>
                                                    )}
                                                    {saveStatus === 'error' && (
                                                        <span className="flex items-center gap-1 text-destructive">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Gagal menyimpan
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <RadioGroup
                                                value={
                                                    answers[
                                                        currentQuestion.id
                                                    ]?.toString() || ''
                                                }
                                                onValueChange={
                                                    handleOptionSelect
                                                }
                                                className="space-y-3"
                                            >
                                                {currentQuestion.options.map(
                                                    (option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() =>
                                                                handleOptionSelect(
                                                                    option.id.toString(),
                                                                )
                                                            }
                                                            className={cn(
                                                                'flex cursor-pointer items-start space-x-3 rounded-xl border-2 p-4 transition-all hover:bg-accent',
                                                                answers[
                                                                    currentQuestion
                                                                        .id
                                                                ] === option.id
                                                                    ? 'border-primary bg-accent ring-1 ring-primary'
                                                                    : 'border-input hover:border-primary/50',
                                                            )}
                                                        >
                                                            <RadioGroupItem
                                                                value={option.id.toString()}
                                                                id={`option-${option.id}`}
                                                                className="pointer-events-none mt-1"
                                                            />

                                                            <div className="flex-1">
                                                                <div
                                                                    className="prose prose-sm dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: option.option_text,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </RadioGroup>

                                            {/* Clear Answer */}
                                            {answers[currentQuestion.id] && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearAnswer}
                                                    className="w-full md:w-auto"
                                                >
                                                    <X className="mr-2 h-4 w-4" />
                                                    Hapus Jawaban
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Desktop Navigation */}
                                    <div className="hidden items-center justify-between md:flex">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setCurrentQuestionIndex(
                                                    (prev) =>
                                                        Math.max(0, prev - 1),
                                                )
                                            }
                                            disabled={
                                                currentQuestionIndex === 0
                                            }
                                            size="lg"
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Sebelumnya
                                        </Button>

                                        {currentQuestionIndex ===
                                        questions.length - 1 ? (
                                            <Button
                                                onClick={handleSubmit}
                                                size="lg"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                Kirim Ujian
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    setCurrentQuestionIndex(
                                                        (prev) =>
                                                            Math.min(
                                                                questions.length -
                                                                    1,
                                                                prev + 1,
                                                            ),
                                                    )
                                                }
                                                size="lg"
                                            >
                                                Lanjut
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </main>

                {/* Desktop Question Navigator Sidebar */}
                <aside className="hidden w-64 overflow-y-auto border-l bg-card p-4 lg:block">
                    <h3 className="mb-3 text-sm font-semibold">
                        Navigasi Soal
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => jumpToQuestion(idx)}
                                className={cn(
                                    'h-10 rounded-lg border-2 text-sm font-medium transition-all',
                                    idx === currentQuestionIndex
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : isAnswered(q.id)
                                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-200'
                                          : 'border-input hover:border-primary/50 hover:bg-accent',
                                )}
                            >
                                {idx + 1}
                                {isFlagged(q.id) && (
                                    <Flag className="ml-1 inline h-3 w-3 fill-current" />
                                )}
                            </button>
                        ))}
                    </div>

                    {flaggedQuestions.size > 0 && (
                        <div className="mt-4 border-t pt-4">
                            <p className="text-xs text-muted-foreground">
                                {flaggedQuestions.size} soal ditandai
                            </p>
                        </div>
                    )}
                </aside>
            </div>

            {/* Mobile Bottom Navigation */}
            {hasQuestions && (
                <div className="sticky bottom-0 flex gap-2 border-t bg-card p-3 md:hidden">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setCurrentQuestionIndex((prev) =>
                                Math.max(0, prev - 1),
                            )
                        }
                        disabled={currentQuestionIndex === 0}
                        className="flex-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                        >
                            Kirim Ujian
                        </Button>
                    ) : (
                        <Button
                            onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                    Math.min(questions.length - 1, prev + 1),
                                )
                            }
                            className="flex-1"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {/* Mobile Question Navigator */}
            {showQuestionNav && (
                <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                    <div className="h-full overflow-y-auto p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold">Navigasi Soal</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQuestionNav(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => jumpToQuestion(idx)}
                                    className={cn(
                                        'relative h-12 rounded-lg border-2 text-sm font-medium transition-all',
                                        idx === currentQuestionIndex
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : isAnswered(q.id)
                                              ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200'
                                              : 'border-input hover:border-primary/50',
                                    )}
                                >
                                    {idx + 1}
                                    {isFlagged(q.id) && (
                                        <Flag className="absolute top-1 right-1 h-2.5 w-2.5 fill-current" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded border-2 border-primary bg-primary" />
                                <span>Soal saat ini</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded border-2 border-green-200 bg-green-50" />
                                <span>Sudah dijawab</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded border-2 border-input" />
                                <span>Belum dijawab</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'animate-in rounded-lg border-2 p-4 shadow-lg slide-in-from-right',
                            toast.type === 'error'
                                ? 'border-red-200 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
                                : toast.type === 'warning'
                                  ? 'border-orange-200 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200'
                                  : 'border-green-200 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200',
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <span className="flex-1 text-sm font-medium">
                                {toast.message}
                            </span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-current opacity-70 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="rounded-2xl">
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

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            className="flex-1"
                        >
                            Batal
                        </Button>

                        <Button
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
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
