import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ExamHeader } from '@/components/ExamHeader';
import { OptionList } from '@/components/OptionList';
import { QuestionCard } from '@/components/QuestionCard';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import { SubmitConfirmDialog } from '@/components/SubmitConfirmDialog';
import { ToastStack } from '@/components/ToastStack';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnswerSync } from '@/hooks/useAnswerSync';
import { useExamTimer } from '@/hooks/useExamTimer';
import { useExamViolations } from '@/hooks/useExamViolations';
import { useToasts } from '@/hooks/useToasts';
import {
    extractFirstImageSrc,
    normalizeImageSrc,
    resolveHtmlImages,
} from '@/utils/htmlImages';

type Responses = Record<number, number>;
type ConfirmMode = 'next_section' | 'submit_exam';

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    image_url?: string | null;
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
    time_limit_minutes?: number;
}

interface ExamProps {
    title: string;
    description: string;
    settings: ExamSettings;
}

interface SectionProps {
    index: number;
    total: number;
    question_bank_id: number;
    title: string;
    timeLimit: number;

    // ✅ add these
    serverNow: string;
    sectionStartedAt: string | null; // because backend can send null
}

interface Props {
    attempt: AttemptProps;
    exam: ExamProps;
    questions: Question[];
    responses: Responses;
    section: SectionProps;
}

export default function TakeExamPage({
    attempt,
    exam,
    questions,
    responses,
    section,
}: Props) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
        new Set(),
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [unansweredCount, setUnansweredCount] = useState(0);
    const [showQuestionNav, setShowQuestionNav] = useState(false);

    const { toasts, showToast, removeToast } = useToasts();

    const { answers, saveStatus, selectAnswer, clearAnswer } = useAnswerSync({
        attemptId: attempt.id,
        initialAnswers: responses || {},
        onToast: showToast,
    });

    const hasQuestions = Array.isArray(questions) && questions.length > 0;
    const currentQuestion = hasQuestions
        ? questions[currentQuestionIndex]
        : null;

    // NOTE: for now answers is Record<number, number>
    const isAnswered = (questionId: number) => questionId in answers;
    const isFlagged = (questionId: number) => flaggedQuestions.has(questionId);

    const answeredCount = useMemo(() => {
        if (!hasQuestions) return 0;
        return questions.reduce(
            (acc, q) => acc + (isAnswered(q.id) ? 1 : 0),
            0,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasQuestions, questions, answers]);

    const progress = hasQuestions
        ? (answeredCount / questions.length) * 100
        : 0;

    const { timeLeft, formatted } = useExamTimer({
        timeLimit: section.timeLimit,
        sectionStartedAt: section.sectionStartedAt ?? section.serverNow,
        serverNow: section.serverNow,
        onExpired: () => {
            setCurrentQuestionIndex(0);
            setShowQuestionNav(false);
            router.post(`/student/exams/${attempt.id}/finish-section`);
        },
        onWarn: showToast,
    });

    // anti-cheat
    useExamViolations({
        attemptId: attempt.id,
        attemptStatus: attempt.status,
        onToast: showToast,
        onFrozen: () => setTimeout(() => window.location.reload(), 2000),
    });

    // html + images
    const questionText = currentQuestion?.question_text ?? '';

    const currentQuestionHtml = useMemo(() => {
        if (!questionText) return '';
        return resolveHtmlImages(questionText);
    }, [questionText]);

    const currentQuestionImage = useMemo(() => {
        if (!currentQuestion) return null;

        const fromField =
            currentQuestion.image_url && currentQuestion.image_url.trim() !== ''
                ? currentQuestion.image_url.trim()
                : null;

        const fromHtml = extractFirstImageSrc(currentQuestion.question_text);
        const src = fromField ?? fromHtml;
        if (!src) return null;

        return normalizeImageSrc(src);
    }, [currentQuestion]);

    const optionsHtml = useMemo(() => {
        const map: Record<number, string> = {};
        const opts = currentQuestion?.options ?? [];

        for (const opt of opts) {
            map[opt.id] = resolveHtmlImages(opt.option_text ?? '');
        }

        return map;
    }, [currentQuestion?.options]);

    const toggleFlag = () => {
        if (!currentQuestion) return;

        setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
            else next.add(currentQuestion.id);
            return next;
        });
    };

    const handleFinishSection = () => {
        if (!hasQuestions) return;

        // ✅ unanswered count should be based on per-question answered
        const unanswered = questions.reduce(
            (acc, q) => acc + (isAnswered(q.id) ? 0 : 1),
            0,
        );

        setUnansweredCount(unanswered);
        setConfirmMode(isLastSection ? 'submit_exam' : 'next_section');
        setConfirmOpen(true);
    };

    const confirmFinishSection = () => {
        // ✅ reset BEFORE navigating to next section
        setCurrentQuestionIndex(0);
        setShowQuestionNav(false);

        setConfirmOpen(false);

        router.post(
            `/student/exams/${attempt.id}/finish-section`,
            {},
            {
                preserveScroll: true,
                // optional but recommended:
                // preserveState: false,
                onFinish: () => {
                    setConfirmOpen(false);
                },
            },
        );
    };

    const jumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setShowQuestionNav(false);
    };

    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isLastSection = section.index === section.total;

    const [confirmMode, setConfirmMode] = useState<ConfirmMode>('next_section');

    return (
        <div
            key={`section-${section.question_bank_id}-${section.index}`}
            className="flex min-h-screen flex-col bg-background"
        >
            <Head title={`Taking Exam: ${exam.title}`} />

            <ExamHeader
                title={exam.title}
                sectionIndex={section.index}
                sectionTotal={section.total}
                sectionTitle={section.title}
                currentIndex={currentQuestionIndex}
                total={questions.length}
                answeredCount={answeredCount}
                progress={progress}
                timeLeft={timeLeft}
                formattedTime={formatted}
                showNav={showQuestionNav}
                onToggleNav={() => setShowQuestionNav((s) => !s)}
            />

            <div className="flex flex-1 overflow-hidden">
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
                                        Sesi ini belum memiliki soal aktif.
                                        Silakan hubungi pengawas.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            currentQuestion && (
                                <div className="space-y-4">
                                    <QuestionCard
                                        questionHtml={currentQuestionHtml}
                                        questionImage={currentQuestionImage}
                                        flagged={isFlagged(currentQuestion.id)}
                                        onToggleFlag={toggleFlag}
                                        saveStatus={saveStatus}
                                    >
                                        <OptionList
                                            questionId={currentQuestion.id}
                                            options={currentQuestion.options}
                                            value={answers[currentQuestion.id]}
                                            optionsHtml={optionsHtml}
                                            onSelect={selectAnswer}
                                            onClear={clearAnswer}
                                        />
                                    </QuestionCard>

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

                                        {isLastQuestion ? (
                                            <Button
                                                onClick={handleFinishSection}
                                                size="lg"
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                {section.index === section.total
                                                    ? 'Kirim Ujian'
                                                    : 'Selesai Sesi'}
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

                <QuestionNavigator
                    variant="desktop"
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    isAnswered={isAnswered}
                    isFlagged={isFlagged}
                    onJump={jumpToQuestion}
                    flaggedCount={flaggedQuestions.size}
                />
            </div>

            {/* mobile bottom controls */}
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

                    {isLastQuestion ? (
                        <Button
                            onClick={handleFinishSection}
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                        >
                            {isLastSection ? 'Kirim Ujian' : 'Selesai Sesi'}
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

            {/* mobile nav overlay */}
            {showQuestionNav && (
                <QuestionNavigator
                    variant="mobile"
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    isAnswered={isAnswered}
                    isFlagged={isFlagged}
                    onJump={jumpToQuestion}
                    flaggedCount={flaggedQuestions.size}
                    onCloseMobile={() => setShowQuestionNav(false)}
                />
            )}

            <ToastStack toasts={toasts} onRemove={removeToast} />

            <SubmitConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                unansweredCount={unansweredCount}
                mode={confirmMode}
                onConfirm={confirmFinishSection}
            />
        </div>
    );
}
