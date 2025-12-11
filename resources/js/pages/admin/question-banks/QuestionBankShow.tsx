import { Head, router } from '@inertiajs/react';
import { Fragment, useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';

import type { BreadcrumbItem } from '@/types';
import type { Question, QuestionBank } from '@/types/question';

type FilterType = 'all' | 'multiple_choice' | 'multiple_select' | 'true_false';

// 👇 Local enhanced type: we add primaryImageUrl
type EnhancedQuestion = Question & {
    primaryImageUrl?: string | null;
};

export default function QuestionBankShow({
    questionBank,
}: {
    questionBank: QuestionBank;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Bank Soal', href: '/admin/question-banks' },
        {
            title: questionBank.name,
            href: `/admin/question-banks/${questionBank.id}`,
        },
    ];

    // make rawQuestions stable for useMemo deps
    const rawQuestions = useMemo<Question[]>(
        () => questionBank.questions ?? [],
        [questionBank.questions],
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [openIds, setOpenIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const toggle = (id: number) =>
        setOpenIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const stripHtmlAndType = (text: string) =>
        text
            .replace(/<[^>]*>/g, '') // strip HTML tags
            .replace(/\(tipe:.*?\)\s*$/i, '') // strip "(tipe: ...)" at end
            .trim();

    const extractFirstImageSrc = (html?: string | null): string | null => {
        if (!html) return null;
        const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        return match ? match[1] : null;
    };

    // 🔍 Filter + sanitize + derive primaryImageUrl
    const filtered = useMemo<EnhancedQuestion[]>(() => {
        const q = searchQuery.toLowerCase();

        return rawQuestions
            .map((question) => {
                const cleanText = stripHtmlAndType(
                    question.question_text || '',
                );

                // 1) Prefer explicit image_url (for URL field)
                // 2) Otherwise, fallback to first <img src="..."> inside HTML question_text
                const fallbackFromHtml = extractFirstImageSrc(
                    question.question_text,
                );

                const primaryImageUrl =
                    question.image_url && question.image_url !== ''
                        ? question.image_url
                        : fallbackFromHtml;

                return {
                    ...question,
                    question_text: cleanText,
                    primaryImageUrl,
                };
            })
            .filter((x) => {
                if (filterType === 'all') return true;
                return x.question_type === filterType;
            })
            .filter((x) => x.question_text.toLowerCase().includes(q));
    }, [rawQuestions, searchQuery, filterType]);

    // Pagination (client side)
    const totalFiltered = filtered.length;
    const lastPage = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
    const safeCurrentPage = Math.min(currentPage, lastPage);
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 10;
        setRowsPerPage(perPage);
        setCurrentPage(1);
    };

    const handleChangePage = (page: number) => {
        if (page < 1 || page > lastPage) return;
        setCurrentPage(page);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'multiple_choice':
                return 'Pilihan Ganda';
            case 'multiple_select':
                return 'Multi Jawaban';
            case 'true_false':
                return 'Benar / Salah';
            default:
                return type;
        }
    };

    const getBadge = (type: string) => {
        switch (type) {
            case 'multiple_choice':
                return 'secondary';
            case 'multiple_select':
                return 'outline';
            case 'true_false':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const letter = (index: number) => String.fromCharCode(65 + index); // A, B, C...

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${questionBank.name} - Soal`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">{questionBank.name}</h1>
                    {questionBank.description && (
                        <p className="text-sm text-muted-foreground">
                            {questionBank.description}
                        </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                        {rawQuestions.length} soal tersedia
                    </p>

                    <Button
                        onClick={() =>
                            router.visit(
                                `/admin/question-banks/${questionBank.id}/questions/create`,
                            )
                        }
                        className="mt-4 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Tambah Soal
                    </Button>
                </div>

                {/* Search + filter */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative max-w-lg flex-1">
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

                    <div className="flex items-center gap-2">
                        <Select
                            value={filterType}
                            onValueChange={(v) => {
                                setFilterType(v as FilterType);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
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
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-accent">
                            <tr>
                                <th className="w-16 px-2 py-3 text-left text-xs font-semibold uppercase">
                                    No.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Teks Soal
                                </th>
                                <th className="w-40 px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Tipe
                                </th>
                                <th className="w-24 px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Poin
                                </th>
                                <th className="w-16 px-2 py-3 text-center text-xs font-semibold uppercase">
                                    Detail
                                </th>
                                <th className="w-32 px-6 py-3 text-left text-xs font-semibold uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {paginated.length > 0 ? (
                                paginated.map((q, index) => {
                                    const isOpen = openIds.includes(q.id);
                                    const overallIndex =
                                        (safeCurrentPage - 1) * rowsPerPage +
                                        index;

                                    const rowBgClass = isOpen
                                        ? 'bg-accent/40'
                                        : 'hover:bg-accent/60';

                                    return (
                                        <Fragment key={q.id}>
                                            <tr className={rowBgClass}>
                                                <td className="px-2 py-3 text-muted-foreground">
                                                    {overallIndex + 1}
                                                </td>

                                                <td className="px-6 py-3">
                                                    <p className="line-clamp-2">
                                                        {q.question_text}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <Badge
                                                        variant={getBadge(
                                                            q.question_type,
                                                        )}
                                                    >
                                                        {getTypeLabel(
                                                            q.question_type,
                                                        )}
                                                    </Badge>
                                                </td>

                                                <td className="px-6 py-3">
                                                    {q.points}
                                                </td>

                                                {/* Collapsible icon (dropdown) */}
                                                <td className="px-2 py-3 text-center">
                                                    <Collapsible open={isOpen}>
                                                        <CollapsibleTrigger
                                                            onClick={() =>
                                                                toggle(q.id)
                                                            }
                                                            className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                                                        >
                                                            {isOpen ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </CollapsibleTrigger>
                                                    </Collapsible>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/admin/questions/${q.id}/edit`,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>

                                                            <AlertDialogContent>
                                                                <AlertDialogTitle>
                                                                    Hapus Soal
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Yakin ingin
                                                                    menghapus
                                                                    soal ini?
                                                                </AlertDialogDescription>

                                                                <div className="flex justify-end gap-2">
                                                                    <AlertDialogCancel>
                                                                        Batal
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() =>
                                                                            router.delete(
                                                                                `/admin/questions/${q.id}`,
                                                                            )
                                                                        }
                                                                        className="bg-destructive"
                                                                    >
                                                                        Hapus
                                                                    </AlertDialogAction>
                                                                </div>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Collapsible Content (same bg when open, no repeated question text) */}
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <Collapsible open={isOpen}>
                                                        <CollapsibleContent>
                                                            <div className="border-t bg-accent/40 p-6 text-sm">
                                                                {/* Image (from URL or embedded HTML) */}
                                                                {q.primaryImageUrl && (
                                                                    <div className="mb-4">
                                                                        <img
                                                                            src={
                                                                                q.primaryImageUrl
                                                                            }
                                                                            className="max-h-56 rounded border object-contain"
                                                                            alt="Gambar soal"
                                                                        />
                                                                    </div>
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
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                                    >
                                        Tidak ada soal ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer navigation (like UnivIndex) */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {totalFiltered === 0 ? 0 : startIndex + 1} -
                        {Math.min(startIndex + rowsPerPage, totalFiltered)} dari{' '}
                        {totalFiltered} soal yang cocok.
                    </div>

                    <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Baris per halaman:
                            </span>
                            <Select
                                value={String(rowsPerPage)}
                                onValueChange={handleChangeRowsPerPage}
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
                                        type="button"
                                        onClick={() =>
                                            handleChangePage(
                                                safeCurrentPage - 1,
                                            )
                                        }
                                        disabled={safeCurrentPage <= 1}
                                        className="disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <PaginationPrevious />
                                    </button>
                                </PaginationItem>

                                {Array.from(
                                    { length: lastPage },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleChangePage(page)
                                            }
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page === safeCurrentPage
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </button>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleChangePage(
                                                safeCurrentPage + 1,
                                            )
                                        }
                                        disabled={safeCurrentPage >= lastPage}
                                        className="disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <PaginationNext />
                                    </button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
