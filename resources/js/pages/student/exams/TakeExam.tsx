import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
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

interface Props {
    attempt: {
        id: number;
        exam_id: number;
    };
    exam: {
        title: string;
        description: string;
        settings: {
            time_limit_minutes: number;
        };
    };
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
        Math.max(0, timeLimit * 60 - elapsedMinutes * 60),
    );
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>(
        'saved',
    );
    const submitRef = useRef(false);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

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

    const handleOptionSelect = (optionId: string) => {
        const id = parseInt(optionId);
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: id,
        }));

        setSaveStatus('saving');
        axios
            .post(`/student/exams/${attempt.id}/save-answer`, {
                question_id: currentQuestion.id,
                selected_option_id: id,
            })
            .then(() => {
                setSaveStatus('saved');
            })
            .catch(() => {
                setSaveStatus('error');
            });
    };

    const handleSubmit = () => {
        if (submitRef.current) return;
        submitRef.current = true;
        router.post(`/student/exams/${attempt.id}/submit`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Head title={`Taking Exam: ${exam.title}`} />

            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold">{exam.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                Question {currentQuestionIndex + 1} of{' '}
                                {questions.length}
                            </p>
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
                    <Progress value={progress} className="h-2" />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto max-w-4xl flex-1 px-4 py-8">
                <div className="grid gap-6">
                    <Card className="border-2">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-xl leading-relaxed">
                                    {currentQuestion.question_text}
                                </CardTitle>
                                <span className="rounded bg-secondary px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground">
                                    {currentQuestion.points} points
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={
                                    answers[currentQuestion.id]?.toString() ||
                                    ''
                                }
                                onValueChange={handleOptionSelect}
                                className="space-y-3"
                            >
                                {currentQuestion.options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={cn(
                                            'flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent',
                                            answers[currentQuestion.id] ===
                                                option.id
                                                ? 'border-primary bg-accent ring-1 ring-primary'
                                                : 'border-input',
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={option.id.toString()}
                                            id={`option-${option.id}`}
                                        />
                                        <Label
                                            htmlFor={`option-${option.id}`}
                                            className="flex-1 cursor-pointer text-base font-normal"
                                        >
                                            {option.option_text}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="justify-between border-t bg-muted/20 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {saveStatus === 'saving' && (
                                    <span className="flex animate-pulse items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        Saving...
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Saved
                                    </span>
                                )}
                                {saveStatus === 'error' && (
                                    <span className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        Error saving
                                    </span>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="sticky bottom-0 border-t bg-card p-4">
                <div className="container mx-auto flex max-w-4xl items-center justify-between">
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
                        Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            Submit Exam
                        </Button>
                    ) : (
                        <Button
                            onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                    Math.min(questions.length - 1, prev + 1),
                                )
                            }
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
}
