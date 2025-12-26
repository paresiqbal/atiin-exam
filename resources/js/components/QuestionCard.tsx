import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react';

export function QuestionCard({
    questionHtml,
    questionImage,
    flagged,
    onToggleFlag,
    saveStatus,
    footerRight,
    children,
}: {
    questionHtml: string;
    questionImage: string | null;
    flagged: boolean;
    onToggleFlag: () => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    footerRight?: React.ReactNode; // ← untuk "Hapus Jawaban"
    children: React.ReactNode;
}) {
    return (
        <Card className="border-2 shadow-sm">
            {/* HEADER */}
            <CardHeader className="space-y-3 pb-4">
                {/* IMAGE FULL WIDTH */}
                {questionImage && (
                    <div className="relative">
                        <img
                            src={questionImage}
                            className="max-h-80 w-full rounded-lg border bg-muted/30 object-contain"
                            alt="gambar soal"
                            loading="lazy"
                            decoding="async"
                        />

                        {/* FLAG BELOW IMAGE */}
                        <Button
                            variant={flagged ? 'default' : 'outline'}
                            size="sm"
                            onClick={onToggleFlag}
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            title={flagged ? 'Hapus tanda' : 'Tandai soal'}
                        >
                            <Flag
                                className={cn(
                                    'h-4 w-4',
                                    flagged && 'fill-current',
                                )}
                            />
                        </Button>
                    </div>
                )}

                {/* QUESTION TEXT */}
                <div
                    className="prose prose-sm md:prose-base dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_p]:my-1.5 md:[&_p]:my-2"
                    dangerouslySetInnerHTML={{ __html: questionHtml }}
                />
            </CardHeader>

            {/* OPTIONS */}
            <CardContent className="space-y-3 pt-0 md:space-y-4">
                {children}
            </CardContent>

            {/* FOOTER: STATUS + CLEAR ANSWER */}
            {(saveStatus !== 'idle' || footerRight) && (
                <CardFooter className="flex items-center justify-between gap-3 border-t pt-3 text-xs md:text-sm">
                    {/* SAVE STATUS */}
                    <div className="flex items-center gap-1.5">
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Menyimpan…
                            </span>
                        )}

                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Tersimpan
                            </span>
                        )}

                        {saveStatus === 'error' && (
                            <span className="flex items-center gap-1.5 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                Gagal menyimpan
                            </span>
                        )}
                    </div>

                    {/* RIGHT SLOT (e.g. Hapus Jawaban) */}
                    {footerRight && <div>{footerRight}</div>}
                </CardFooter>
            )}
        </Card>
    );
}
