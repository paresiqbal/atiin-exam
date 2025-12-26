import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Map } from 'lucide-react';
import { useMemo, useState } from 'react';

type QuestionMapQuestion = {
    id: number;
};

interface QuestionMapProps {
    questions: QuestionMapQuestion[];
    currentIndex: number;
    answers: Record<number, number>;
    onJump: (index: number) => void;
}

export function QuestionMap({
    questions,
    currentIndex,
    answers,
    onJump,
}: QuestionMapProps) {
    const [open, setOpen] = useState(false);

    const isAnswered = (questionId: number) =>
        answers[questionId] !== undefined;

    const answeredCount = useMemo(() => {
        return questions.reduce(
            (acc, q) => acc + (isAnswered(q.id) ? 1 : 0),
            0,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questions, answers]);

    const handleJumpMobile = (index: number) => {
        onJump(index);
        setOpen(false);
    };

    return (
        <>
            <div className="fixed right-4 bottom-24 z-20 md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button
                            size="lg"
                            className="h-14 rounded-full border-2 border-primary bg-card px-6 font-semibold text-primary shadow-lg hover:bg-primary hover:text-primary-foreground"
                        >
                            <Map className="mr-2 h-5 w-5" />
                            Peta Soal
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                                {answeredCount}/{questions.length}
                            </span>
                        </Button>
                    </SheetTrigger>

                    <SheetContent
                        side="bottom"
                        className="h-[85vh] border-t-2 bg-background"
                    >
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-xl font-bold">
                                Peta Soal
                            </SheetTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {answeredCount} dari {questions.length} soal
                                terjawab
                            </p>
                        </SheetHeader>

                        <div className="mb-4 space-y-3 rounded-lg border bg-muted p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary bg-primary font-bold text-primary-foreground">
                                    {currentIndex + 1}
                                </div>
                                <span className="text-sm font-medium">
                                    Soal saat ini
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-green-600 bg-green-600">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-sm font-medium">
                                    Sudah dijawab
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-muted-foreground bg-background">
                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium">
                                    Belum dijawab
                                </span>
                            </div>
                        </div>

                        <div className="grid [grid-template-columns:repeat(4,minmax(0,1fr))] gap-3 overflow-y-auto pb-6">
                            {questions.map((q, i) => (
                                <button
                                    key={q.id}
                                    onClick={() => handleJumpMobile(i)}
                                    className={cn(
                                        'h-16 rounded-lg border-2 text-lg font-bold transition-all active:scale-95',
                                        currentIndex === i
                                            ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                                            : isAnswered(q.id)
                                              ? 'border-green-600 bg-green-600 text-white shadow-md hover:bg-green-700'
                                              : 'border-muted-foreground bg-background hover:border-primary hover:bg-accent',
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="fixed top-24 right-4 hidden w-72 flex-col gap-4 rounded-xl border-2 bg-card p-5 shadow-lg md:flex">
                <div>
                    <h2 className="mb-1 text-xl font-bold">Peta Soal</h2>
                    <p className="text-sm text-muted-foreground">
                        {answeredCount} dari {questions.length} terjawab
                    </p>
                </div>

                <div className="space-y-2 rounded-lg border bg-muted p-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md border-2 border-primary bg-primary" />
                        <span className="font-medium">Soal saat ini</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md border-2 border-green-600 bg-green-600" />
                        <span className="font-medium">Sudah dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md border-2 border-muted-foreground bg-background" />
                        <span className="font-medium">Belum dijawab</span>
                    </div>
                </div>

                <div className="grid max-h-[calc(100vh-400px)] grid-cols-5 gap-2.5 overflow-y-auto pr-1">
                    {questions.map((q, i) => (
                        <button
                            key={q.id}
                            onClick={() => onJump(i)}
                            className={cn(
                                'h-12 w-12 rounded-lg border-2 text-base font-bold transition-all hover:scale-105 active:scale-95',
                                currentIndex === i
                                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                    : isAnswered(q.id)
                                      ? 'border-green-600 bg-green-600 text-white shadow-sm hover:bg-green-700'
                                      : 'border-muted-foreground bg-background hover:border-primary hover:bg-accent',
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
