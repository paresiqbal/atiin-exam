import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    Search,
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import type { Question } from '@/types/question';

type FilterType = 'all' | 'multiple_choice' | 'multiple_select' | 'true_false';

export interface ExamQuestionListProps {
    questions: Question[];
}

type EnhancedQuestion = Question & {
    cleanText: string;
    primaryImageUrl?: string | null;
};

export function ExamQuestionList({ questions }: ExamQuestionListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [openIds, setOpenIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const toggle = (id: number) =>
        setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const stripHtml = (text: string) =>
        text
            .replace(/<[^>]*>/g, '')
            .replace(/\(tipe:.*?\)\s*$/i, '')
            .trim();

    const extractFirstImageSrc = (html?: string | null): string | null => {
        if (!html) return null;
        const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        return match ? match[1] : null;
    };

    // 🔍 Filtering + sanitizing
    const filtered = useMemo<EnhancedQuestion[]>(() => {
        const query = searchQuery.toLowerCase().trim();

        return questions
            .map((question) => {
                const cleanText = stripHtml(question.question_text || '');
                const foundImage = extractFirstImageSrc(question.question_text);

                const primaryImageUrl =
                    question.image_url && question.image_url !== ''
                        ? question.image_url
                        : foundImage;

                return { ...question, cleanText, primaryImageUrl };
            })
            .filter((item) => {
                if (filterType === 'all') return true;
                return item.question_type === filterType;
            })
            .filter((item) => item.cleanText.toLowerCase().includes(query));
    }, [questions, searchQuery, filterType]);

    // 📄 Pagination
    const totalFiltered = filtered.length;
    const lastPage = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));

    const safeCurrent = Math.min(currentPage, lastPage);
    const startIndex = (safeCurrent - 1) * rowsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

    const handleChangeRows = (v: string) => {
        setRowsPerPage(Number(v) || 10);
        setCurrentPage(1);
    };

    const handlePage = (p: number) => {
        if (p >= 1 && p <= lastPage) setCurrentPage(p);
    };

    const typeLabel = (t: string) =>
        t === 'multiple_choice'
            ? 'Pilihan Ganda'
            : t === 'multiple_select'
              ? 'Multi Jawaban'
              : t === 'true_false'
                ? 'Benar / Salah'
                : t;

    const typeBadge = (t: string) =>
        t === 'multiple_choice'
            ? 'secondary'
            : t === 'multiple_select'
              ? 'outline'
              : 'default';

    const letter = (i: number) => String.fromCharCode(65 + i);

    return (
        <div className="space-y-4">
            {/* Search + Filter */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Cari teks soal..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    {searchQuery && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {totalFiltered} soal ditemukan
                        </p>
                    )}
                </div>

                <Select
                    value={filterType}
                    onValueChange={(v) => {
                        setFilterType(v as FilterType);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Semua tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua tipe</SelectItem>
                        <SelectItem value="multiple_choice">
                            Pilihan Ganda
                        </SelectItem>
                        <SelectItem value="multiple_select">
                            Multi Jawaban
                        </SelectItem>
                        <SelectItem value="true_false">
                            Benar / Salah
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* TABLE */}
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
                        {paginated.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    Tidak ada soal ditemukan.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((q, idx) => {
                                const globalIndex =
                                    (safeCurrent - 1) * rowsPerPage + idx;
                                const open = openIds.includes(q.id);

                                return (
                                    <Fragment key={q.id}>
                                        <tr
                                            className={`hover:bg-accent/40 ${
                                                open ? 'bg-accent/30' : ''
                                            }`}
                                        >
                                            <td className="px-2 py-3">
                                                {globalIndex + 1}
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="line-clamp-2">
                                                    {q.cleanText}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={typeBadge(
                                                        q.question_type,
                                                    )}
                                                >
                                                    {typeLabel(q.question_type)}
                                                </Badge>
                                            </td>

                                            <td className="px-2 py-3 text-center">
                                                <Collapsible open={open}>
                                                    <CollapsibleTrigger
                                                        onClick={() =>
                                                            toggle(q.id)
                                                        }
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

                                        {/* COLLAPSIBLE CONTENT */}
                                        <tr>
                                            <td colSpan={4} className="p-0">
                                                <Collapsible open={open}>
                                                    <CollapsibleContent>
                                                        <div className="border-t bg-accent/20 p-4">
                                                            {/* Image */}
                                                            {q.primaryImageUrl && (
                                                                <img
                                                                    src={
                                                                        q.primaryImageUrl
                                                                    }
                                                                    className="mb-4 max-h-60 rounded border object-contain"
                                                                    alt="gambar soal"
                                                                />
                                                            )}

                                                            {/* Options */}
                                                            <div className="space-y-1">
                                                                {q.options?.map(
                                                                    (
                                                                        opt,
                                                                        i,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                opt.id
                                                                            }
                                                                            className="flex items-start gap-2"
                                                                        >
                                                                            {opt.is_correct ? (
                                                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                            ) : (
                                                                                <Circle className="h-4 w-4 text-muted-foreground" />
                                                                            )}

                                                                            <span
                                                                                className={
                                                                                    opt.is_correct
                                                                                        ? 'font-semibold'
                                                                                        : ''
                                                                                }
                                                                            >
                                                                                {letter(
                                                                                    i,
                                                                                )}

                                                                                .{' '}
                                                                                {
                                                                                    opt.option_text
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
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

            {/* FOOTER: rows per page + pagination */}
            <div className="flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
                <div className="text-sm text-muted-foreground">
                    Menampilkan {totalFiltered === 0 ? 0 : startIndex + 1} -
                    {Math.min(startIndex + rowsPerPage, totalFiltered)} dari{' '}
                    {totalFiltered} soal.
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Baris per halaman:
                        </span>
                        <Select
                            value={String(rowsPerPage)}
                            onValueChange={handleChangeRows}
                        >
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <button
                                    onClick={() => handlePage(safeCurrent - 1)}
                                    disabled={safeCurrent <= 1}
                                    className="disabled:opacity-50"
                                >
                                    <PaginationPrevious />
                                </button>
                            </PaginationItem>

                            {Array.from({ length: lastPage }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <button onClick={() => handlePage(i + 1)}>
                                        <PaginationLink
                                            isActive={i + 1 === safeCurrent}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </button>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <button
                                    onClick={() => handlePage(safeCurrent + 1)}
                                    disabled={safeCurrent >= lastPage}
                                    className="disabled:opacity-50"
                                >
                                    <PaginationNext />
                                </button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
