import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

type AttemptQuestion = {
    id: number;
    question_text: string;
    question_type: string;
    student_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
};

export function AttemptQuestionList({
    questions,
}: {
    questions: AttemptQuestion[];
}) {
    const [openIds, setOpenIds] = useState<number[]>([]);

    const toggle = (id: number) =>
        setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const stripHtml = (text: string) =>
        text
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

    const extractFirstImageSrc = (html?: string | null): string | null => {
        if (!html) return null;
        const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        return match ? match[1] : null;
    };

    const typeLabel = (t: string) =>
        t === 'multiple_choice'
            ? 'Pilihan Ganda'
            : t === 'multiple_select'
              ? 'Multi Jawaban'
              : t === 'true_false'
                ? 'Benar / Salah'
                : t;

    const rows = useMemo(() => {
        return questions.map((q) => ({
            ...q,
            cleanText: stripHtml(q.question_text || ''),
            primaryImageUrl: extractFirstImageSrc(q.question_text),
        }));
    }, [questions]);

    return (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full text-sm">
                <thead className="border-b bg-accent">
                    <tr>
                        <th className="w-12 px-2 py-2 text-left text-xs uppercase">
                            No
                        </th>
                        <th className="px-4 py-2 text-left text-xs uppercase">
                            Soal
                        </th>
                        <th className="w-40 px-4 py-2 text-left text-xs uppercase">
                            Tipe
                        </th>
                        <th className="w-20 px-4 py-2 text-center text-xs uppercase">
                            Detail
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y">
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="py-8 text-center text-muted-foreground"
                            >
                                Tidak ada pertanyaan yang ditemukan untuk
                                percobaan ini.
                            </td>
                        </tr>
                    ) : (
                        rows.map((q, idx) => {
                            const open = openIds.includes(q.id);

                            return (
                                <Fragment key={q.id}>
                                    <tr
                                        className={`hover:bg-accent/40 ${
                                            open ? 'bg-accent/30' : ''
                                        }`}
                                    >
                                        <td className="px-2 py-3">{idx + 1}</td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-2">
                                                {q.is_correct ? (
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                                                )}
                                                <p className="line-clamp-2">
                                                    {q.cleanText}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <Badge variant="outline">
                                                {typeLabel(q.question_type)}
                                            </Badge>
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            <Collapsible open={open}>
                                                <CollapsibleTrigger
                                                    onClick={() => toggle(q.id)}
                                                    className="mx-auto flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                                                >
                                                    {open ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td colSpan={4} className="p-0">
                                            <Collapsible open={open}>
                                                <CollapsibleContent>
                                                    <div className="space-y-4 border-t bg-accent/20 p-4">
                                                        {/* Image from question_text */}
                                                        {q.primaryImageUrl && (
                                                            <img
                                                                src={
                                                                    q.primaryImageUrl
                                                                }
                                                                className="max-h-60 rounded border object-contain"
                                                                alt="gambar soal"
                                                            />
                                                        )}

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            {/* Student Answer */}
                                                            <div className="rounded-md border p-3">
                                                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                                    Jawaban
                                                                    Siswa
                                                                </p>
                                                                {q.student_answer ? (
                                                                    <div
                                                                        className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: q.student_answer,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground italic">
                                                                        Tidak
                                                                        dijawab
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Correct Answer */}
                                                            <div className="rounded-md border bg-secondary/40 p-3">
                                                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                                    Jawaban
                                                                    Benar
                                                                </p>
                                                                {q.correct_answer ? (
                                                                    <div
                                                                        className="prose prose-sm max-w-none [&_img]:h-auto [&_img]:max-w-full"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: q.correct_answer,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground italic">
                                                                        Tidak
                                                                        ada
                                                                        jawaban
                                                                        benar
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </td>
                                    </tr>
                                </Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
