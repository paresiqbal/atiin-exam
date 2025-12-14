import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react';
import type { SaveStatus } from '../hooks/useAnswerSync';

export function QuestionCard({
    questionHtml,
    questionImage,
    points,
    flagged,
    onToggleFlag,
    saveStatus,
    children,
}: {
    questionHtml: string;
    questionImage: string | null;
    points: number;
    flagged: boolean;
    onToggleFlag: () => void;
    saveStatus: SaveStatus;
    children: React.ReactNode;
}) {
    return (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <CardTitle className="flex-1 text-base leading-relaxed md:text-lg">
                        {questionImage && (
                            <img
                                src={questionImage}
                                className="mb-4 max-h-80 w-full rounded-lg border object-contain"
                                alt="gambar soal"
                                loading="lazy"
                                decoding="async"
                            />
                        )}

                        <div
                            className="prose prose-sm dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_p]:my-2"
                            dangerouslySetInnerHTML={{ __html: questionHtml }}
                        />
                    </CardTitle>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium whitespace-nowrap">
                            {points} poin
                        </span>

                        <Button
                            variant={flagged ? 'default' : 'ghost'}
                            size="sm"
                            onClick={onToggleFlag}
                            className="h-8 w-8 p-0"
                        >
                            <Flag
                                className={cn(
                                    'h-4 w-4',
                                    flagged && 'fill-current',
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {saveStatus !== 'idle' && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        {saveStatus === 'saving' && (
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

            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}
