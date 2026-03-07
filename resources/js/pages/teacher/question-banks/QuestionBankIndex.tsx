import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Eye, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
import { getPaginationRange } from '@/lib/pagination';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Checkbox } from '@/components/ui/checkbox';

import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { QuestionBank } from '@/types/question-bank';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface QuestionBankWithCounts extends QuestionBank {
    questions_count: number;
}

interface QuestionBankPageProps extends InertiaPageProps {
    questionBanks: Paginated<QuestionBankWithCounts>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Teacher Dashboard', href: '/teacher/dashboard' },
    { title: 'Bank Soal', href: '/teacher/question-banks' },
];

const baseUrl = '/teacher/question-banks';

export default function TeacherQuestionBankIndex() {
    const { questionBanks } = usePage<QuestionBankPageProps>().props;

    const data = useMemo(() => questionBanks.data ?? [], [questionBanks.data]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (questionBanks as Paginated<QuestionBankWithCounts>).per_page ?? 10,
    );

    // Filter by name & description
    const filteredBanks = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return data.filter((bank) => {
            return (
                bank.name.toLowerCase().includes(q) ||
                (bank.description ?? '').toLowerCase().includes(q)
            );
        });
    }, [data, searchQuery]);

    // Stats
    const totalQuestions = filteredBanks.reduce(
        (sum, bank) => sum + (bank.questions_count ?? 0),
        0,
    );

    const avgQuestions =
        filteredBanks.length > 0
            ? (totalQuestions / filteredBanks.length).toFixed(1)
            : '0';

    // Selection logic
    const allSelected =
        filteredBanks.length > 0 &&
        filteredBanks.every((b) => selectedIds.includes(b.id));

    const someSelected =
        selectedIds.length > 0 && selectedIds.length < filteredBanks.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredBanks.map((b) => b.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !filteredBanks.some((b) => b.id === id)),
            );
        }
    };

    const handleToggleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
            );
        } else {
            setSelectedIds((prev) =>
                prev.filter((selectedId) => selectedId !== id),
            );
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        return router.delete(`${baseUrl}/bulk-delete`, {
            data: { ids: selectedIds },
            onSuccess: () => {
                setSelectedIds([]);
            },
        });
    };

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 10;
        setRowsPerPage(perPage);

        router.get(
            `${baseUrl}`,
            { page: 1, per_page: perPage },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Soal" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Bank Soal</h1>
                        <p className="text-muted-foreground">
                            Kelola bank soal untuk ujian dan latihan siswa.
                        </p>
                    </div>

                    <div>
                        <Link href={`${baseUrl}/create`}>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Buat Bank Soal
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search + bulk delete */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama atau deskripsi bank soal..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredBanks.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="bank soal"
                            disabled={selectedIds.length === 0}
                            onConfirm={handleBulkDelete}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Bank Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {filteredBanks.length}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalQuestions}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Rata-rata Soal per Bank
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {avgQuestions}
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-accent">
                            <tr>
                                <th className="w-10 px-4 py-2">
                                    <Checkbox
                                        checked={checkboxValue}
                                        onCheckedChange={(value) =>
                                            handleToggleSelectAll(
                                                value === true,
                                            )
                                        }
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Nama Bank Soal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Deskripsi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Jumlah Soal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Dibuat Pada
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredBanks.length > 0 ? (
                                filteredBanks.map((bank) => {
                                    const isSelected = selectedIds.includes(
                                        bank.id,
                                    );

                                    return (
                                        <tr
                                            key={bank.id}
                                            className={`transition-colors hover:bg-accent ${
                                                isSelected ? 'bg-accent' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            bank.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2 font-medium">
                                                {bank.name}
                                            </td>

                                            <td className="px-6 py-2">
                                                {bank.description ? (
                                                    <span className="line-clamp-2 text-sm text-muted-foreground">
                                                        {bank.description}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2">
                                                {bank.questions_count ?? 0}
                                            </td>

                                            <td className="px-6 py-2 text-sm text-muted-foreground">
                                                {bank.created_at
                                                    ? new Date(
                                                          bank.created_at,
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        asChild
                                                        size="icon"
                                                        variant="ghost"
                                                        className="hover:bg-foreground/10"
                                                    >
                                                        <Link
                                                            href={`${baseUrl}/${bank.id}`}
                                                            aria-label={`Lihat detail bank soal ${bank.name}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        asChild
                                                        size="icon"
                                                        variant="ghost"
                                                        className="hover:bg-foreground/10"
                                                    >
                                                        <Link
                                                            href={`${baseUrl}/${bank.id}/edit`}
                                                            aria-label={`Edit bank soal ${bank.name}`}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${bank.id}`}
                                                        resourceLabel="bank soal"
                                                        itemName={bank.name}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-sm text-slate-500"
                                    >
                                        Tidak ada bank soal ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: selection info + rows-per-page + pagination */}
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {questionBanks.total} baris
                        dipilih.
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
                                    {questionBanks.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                questionBanks.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    questionBanks.current_page,
                                    questionBanks.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    questionBanks.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {questionBanks.current_page <
                                    questionBanks.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                questionBanks.current_page + 1
                                            }&per_page=${rowsPerPage}`}
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
                </div>
            </div>
        </AppLayout>
    );
}
