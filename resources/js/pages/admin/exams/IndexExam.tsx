import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

// types
import type { BreadcrumbItem } from '@/types';
import type { ExamData } from '@/types/exam';

interface PaginatedExams {
    data: ExamData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

const baseUrl = '/admin/exams';

export default function IndexExam({ exams }: { exams: PaginatedExams }) {
    const [examToDelete, setExamToDelete] = useState<ExamData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleConfirmDelete = () => {
        if (!examToDelete) return;

        router.delete(`/admin/exams/${examToDelete.id}`, {
            onFinish: () => setExamToDelete(null),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Ujian', href: baseUrl },
    ];

    const filteredExams = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return exams.data.filter((exam) => {
            const nameMatch = exam.name.toLowerCase().includes(q);
            const bankMatch = exam.question_bank?.name
                ?.toLowerCase()
                .includes(q);

            return nameMatch || bankMatch;
        });
    }, [exams.data, searchQuery]);

    const formatDate = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ujian" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Daftar Ujian</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola ujian yang tersedia untuk sekolah Anda.
                        </p>
                    </div>
                    <Link href={`${baseUrl}/create`}>
                        <Button className="bg-primary/90 text-primary-foreground">
                            Buat Ujian
                        </Button>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama ujian atau bank soal..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredExams.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>
                    <div className="flex items-center gap-2" />
                </div>

                {/* Empty state */}
                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            Belum ada ujian yang dibuat.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto rounded-lg border shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Bank Soal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Peserta
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredExams.length > 0 ? (
                                        filteredExams.map((exam) => (
                                            <tr
                                                key={exam.id}
                                                className="transition-colors hover:bg-foreground/10"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {exam.name}
                                                </td>

                                                <td className="px-6 py-4 text-sm">
                                                    {exam.question_bank?.name ??
                                                        '-'}
                                                </td>

                                                {/* Date column: start - end */}
                                                <td className="px-6 py-4 text-sm">
                                                    {formatDate(
                                                        exam.created_at,
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-sm">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            exam.is_published
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {exam.is_published
                                                            ? 'Publis'
                                                            : 'Draf'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-sm">
                                                    {exam.attempts_count}
                                                </td>

                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`${baseUrl}/${exam.id}`}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                Lihat
                                                            </Button>
                                                        </Link>
                                                        <Link
                                                            href={`${baseUrl}/${exam.id}/edit`}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                setExamToDelete(
                                                                    exam,
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-8 text-center text-sm text-slate-500"
                                            >
                                                Tidak ada ujian yang cocok
                                                dengan pencarian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center py-4">
                            <Pagination>
                                <PaginationContent>
                                    {/* Previous */}
                                    <PaginationItem>
                                        {exams.current_page > 1 ? (
                                            <Link
                                                href={`${baseUrl}?page=${
                                                    exams.current_page - 1
                                                }`}
                                            >
                                                <PaginationPrevious />
                                            </Link>
                                        ) : (
                                            <PaginationPrevious className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>

                                    {/* Page numbers */}
                                    {Array.from(
                                        { length: exams.last_page },
                                        (_, i) => i + 1,
                                    ).map((page) => (
                                        <PaginationItem key={page}>
                                            <Link
                                                href={`${baseUrl}?page=${page}`}
                                            >
                                                <PaginationLink
                                                    isActive={
                                                        page ===
                                                        exams.current_page
                                                    }
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </Link>
                                        </PaginationItem>
                                    ))}

                                    {/* Next */}
                                    <PaginationItem>
                                        {exams.current_page <
                                        exams.last_page ? (
                                            <Link
                                                href={`${baseUrl}?page=${
                                                    exams.current_page + 1
                                                }`}
                                            >
                                                <PaginationNext />
                                            </Link>
                                        ) : (
                                            <PaginationNext className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </>
                )}

                {/* Modal for deleting an exam */}
                <AlertDialog
                    open={!!examToDelete}
                    onOpenChange={(open) => !open && setExamToDelete(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Ujian?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {examToDelete
                                    ? `Anda yakin ingin menghapus ujian "${examToDelete.name}"? Jika ujian sudah pernah dikerjakan siswa, ujian tidak dapat dihapus.`
                                    : 'Anda yakin ingin menghapus ujian ini?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => setExamToDelete(null)}
                            >
                                Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleConfirmDelete}
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
