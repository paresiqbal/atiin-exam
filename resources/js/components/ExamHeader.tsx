import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock, Menu, X } from 'lucide-react';

// ============ EXAM HEADER ============
export function ExamHeader({
    title,
    sectionIndex,
    sectionTotal,
    sectionTitle,
    currentIndex,
    total,
    answeredCount,
    progress,
    timeLeft,
    formattedTime,
    showNav,
    onToggleNav,
}: {
    title: string;
    sectionIndex: number;
    sectionTotal: number;
    sectionTitle: string;
    currentIndex: number;
    total: number;
    answeredCount: number;
    progress: number;
    timeLeft: number;
    formattedTime: string;
    showNav: boolean;
    onToggleNav: () => void;
}) {
    return (
        <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="mx-auto w-full max-w-5xl px-3 py-2.5 md:px-4 md:py-3">
                {/* Mobile Layout - Compact */}
                <div className="md:hidden">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="inline-flex shrink-0 items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] leading-tight font-semibold">
                                {sectionIndex}/{sectionTotal}
                            </span>
                            <h1 className="truncate text-sm font-bold">
                                {title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <div
                                className={cn(
                                    'flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-xs font-semibold',
                                    timeLeft < 300
                                        ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                        : timeLeft < 600
                                          ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200'
                                          : 'bg-secondary',
                                )}
                            >
                                <Clock className="h-3 w-3" />
                                <span className="tabular-nums">
                                    {formattedTime}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleNav}
                                className="h-8 w-8 p-0"
                            >
                                {showNav ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <Menu className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="flex-1 truncate text-[11px] text-muted-foreground">
                            {sectionTitle}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                                {currentIndex + 1}/{total}
                            </span>
                            <span className="text-[11px] font-semibold text-primary">
                                {answeredCount}/{total}
                            </span>
                        </div>
                    </div>

                    <Progress value={progress} className="h-1" />
                </div>

                {/* Desktop Layout - Spacious */}
                <div className="hidden md:block">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-3">
                                <span className="inline-flex shrink-0 items-center rounded-lg border bg-secondary px-3 py-1 text-xs font-semibold">
                                    Sesi {sectionIndex} dari {sectionTotal}
                                </span>

                                <h1 className="min-w-0 truncate text-lg font-bold lg:text-xl">
                                    {title}
                                </h1>
                            </div>

                            <p className="mb-2 truncate text-sm text-muted-foreground">
                                {sectionTitle}
                            </p>

                            <div className="flex items-center gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Soal {currentIndex + 1} dari {total}
                                </p>
                                <p className="text-sm font-semibold text-primary">
                                    {answeredCount} dari {total} terjawab
                                </p>
                            </div>
                        </div>

                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-xl border px-5 py-3 font-mono text-xl font-semibold',
                                timeLeft < 300
                                    ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                    : timeLeft < 600
                                      ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200'
                                      : 'bg-secondary',
                            )}
                        >
                            <Clock className="h-5 w-5" />
                            <span className="tabular-nums">
                                {formattedTime}
                            </span>
                        </div>
                    </div>

                    <Progress value={progress} className="mt-3 h-2" />
                </div>
            </div>
        </header>
    );
}
