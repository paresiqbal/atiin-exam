import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock, Menu, X } from 'lucide-react';

export function ExamHeader({
    title,
    sectionLabel, // ✅ NEW
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
    sectionLabel?: string; // ✅ NEW
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
            <div className="mx-auto w-full max-w-5xl px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold md:text-lg">
                            {title}
                        </h1>

                        {/* ✅ NEW: section info */}
                        {sectionLabel ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {sectionLabel}
                            </p>
                        ) : null}

                        <div className="mt-1 flex items-center gap-3">
                            <p className="text-xs text-muted-foreground md:text-sm">
                                {currentIndex + 1}/{total}
                            </p>
                            <p className="text-xs font-medium text-primary md:text-sm">
                                {answeredCount}/{total} terjawab
                            </p>
                        </div>
                    </div>

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
                                {formattedTime}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleNav}
                            className="md:hidden"
                        >
                            {showNav ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                <Progress value={progress} className="mt-3 h-1.5" />
            </div>
        </header>
    );
}
