import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Flag, X } from 'lucide-react';

export function QuestionNavigator({
    questions,
    currentQuestionIndex,
    isAnswered,
    isFlagged,
    onJump,
    flaggedCount,
    variant,
    onCloseMobile,
}: {
    questions: { id: number }[];
    currentQuestionIndex: number;
    isAnswered: (id: number) => boolean;
    isFlagged: (id: number) => boolean;
    onJump: (index: number) => void;
    flaggedCount: number;
    variant: 'desktop' | 'mobile';
    onCloseMobile?: () => void;
}) {
    if (variant === 'desktop') {
        return (
            <aside className="hidden w-64 overflow-y-auto border-l bg-card p-4 lg:block">
                <h3 className="mb-3 text-sm font-semibold">Navigasi Soal</h3>
                <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => onJump(idx)}
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

                {flaggedCount > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                            {flaggedCount} soal ditandai
                        </p>
                    </div>
                )}
            </aside>
        );
    }

    // mobile overlay
    return (
        <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="h-full overflow-y-auto p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Navigasi Soal</h3>
                    <Button variant="ghost" size="sm" onClick={onCloseMobile}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => onJump(idx)}
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
    );
}
