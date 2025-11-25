import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type QuestionMapQuestion = {
    id: number;
};

interface QuestionMapProps {
    questions: QuestionMapQuestion[];
    currentIndex: number;
    answers: Record<number, number>; // questionId -> selectedOptionId
    onJump: (index: number) => void;
}

export function QuestionMap({
    questions,
    currentIndex,
    answers,
    onJump,
}: QuestionMapProps) {
    const isAnswered = (questionId: number) => {
        return answers[questionId] !== undefined;
    };

    return (
        <>
            <div className="fixed right-4 bottom-20 z-20 md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="bg-secondary text-secondary-foreground">
                            Peta Ujian
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="right" className="w-72">
                        <SheetHeader>
                            <SheetTitle>Question Map</SheetTitle>
                        </SheetHeader>

                        <div className="mt-4 grid grid-cols-4 gap-3">
                            {questions.map((q, i) => (
                                <button
                                    key={q.id}
                                    onClick={() => onJump(i)}
                                    className={cn(
                                        'rounded-md border p-3 text-center text-sm font-medium transition',
                                        currentIndex === i
                                            ? 'border-primary ring-2 ring-primary'
                                            : 'border-input',
                                        isAnswered(q.id)
                                            ? 'bg-green-500/20'
                                            : 'bg-red-500/20',
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* DESKTOP RIGHT SIDEBAR */}
            <div className="fixed top-24 right-4 hidden w-60 flex-col gap-4 rounded-lg border bg-card p-4 md:flex">
                <h2 className="text-lg font-semibold">Questions</h2>

                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, i) => (
                        <button
                            key={q.id}
                            onClick={() => onJump(i)}
                            className={cn(
                                'h-10 w-10 rounded-md border text-center text-sm font-medium transition',
                                currentIndex === i
                                    ? 'border-primary ring-2 ring-primary'
                                    : 'border-input',
                                isAnswered(q.id)
                                    ? 'bg-green-500/20'
                                    : 'bg-red-500/20',
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
