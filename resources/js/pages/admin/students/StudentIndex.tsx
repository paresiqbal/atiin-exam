import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, Eye, KeyRound, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmBulkDeleteButton } from '@/components/ConfirmBulkDeleteButton';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import ActionIconTooltip from '@/components/ActionIconTooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { getPaginationRange } from '@/lib/pagination';

interface School {
    id: number;
    name: string;
}

interface Student {
    id: number;
    name: string;
    email: string;
    school?: School | null;
    total_exams: number;
    average_score?: number | null;
}

interface StudentPageProps extends InertiaPageProps {
    students: Paginated<Student>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Siswa', href: '/admin/students' },
];

const baseUrl = '/admin/students';

type SchoolFilter = 'all' | number;

export default function StudentIndex() {
    const { students } = usePage<StudentPageProps>().props;
    const data = useMemo(() => students.data ?? [], [students.data]);

    const [searchQuery, setSearchQuery] = useState('');
    const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (students as Paginated<Student>).per_page ?? 10,
    );

    const schoolOptions = useMemo(() => {
        const map = new Map<number, string>();

        data.forEach((s) => {
            if (s.school) {
                map.set(s.school.id, s.school.name);
            }
        });

        return Array.from(map.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    }, [data]);

    // Filtering (search + school)
    const filteredStudents = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return data.filter((s) => {
            const schoolName = s.school?.name ?? '';

            const matchesSearch =
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                schoolName.toLowerCase().includes(q);

            const matchesSchool =
                schoolFilter === 'all' ? true : s.school?.id === schoolFilter;

            return matchesSearch && matchesSchool;
        });
    }, [data, searchQuery, schoolFilter]);

    // Stats
    const totalStudents = filteredStudents.length;

    const uniqueSchoolIds = new Set(
        filteredStudents
            .map((s) => s.school?.id)
            .filter((id): id is number => typeof id === 'number'),
    );

    const totalSchools = uniqueSchoolIds.size;

    const avgStudentsPerSchool =
        totalSchools > 0 ? (totalStudents / totalSchools).toFixed(1) : '0';

    // Selection logic (same style as UserIndex)
    const allSelected = useMemo(
        () =>
            filteredStudents.length > 0 &&
            filteredStudents.every((s) => selectedIds.includes(s.id)),
        [filteredStudents, selectedIds],
    );

    const someSelected =
        selectedIds.length > 0 && selectedIds.length < filteredStudents.length;

    const checkboxValue: boolean | 'indeterminate' = allSelected
        ? true
        : someSelected
          ? 'indeterminate'
          : false;

    const handleToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredStudents.map((s) => s.id));
        } else {
            setSelectedIds((prev) =>
                prev.filter((id) => !filteredStudents.some((s) => s.id === id)),
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
            data: {
                ids: selectedIds,
            },
            onSuccess: () => {
                setSelectedIds([]);
            },
        });
    };

    const handleBulkResetPassword = () => {
        if (selectedIds.length === 0) return;

        return router.post(
            `${baseUrl}/bulk-reset-password`,
            { ids: selectedIds },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                },
            },
        );
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
            <Head title="Daftar Siswa" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Daftar Siswa</h1>
                        <p className="text-muted-foreground">
                            Kelola data siswa beserta sekolah dan aktivitas
                            ujian
                        </p>
                    </div>

                    <div>
                        <Link href={`${baseUrl}/create`}>
                            <Button>
                                Tambah Siswa <Plus />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama, email, atau sekolah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery !== '' && (
                                <InputGroupAddon align="inline-end">
                                    {filteredStudents.length} hasil
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter by school */}
                        <Select
                            value={
                                schoolFilter === 'all'
                                    ? 'all'
                                    : String(schoolFilter)
                            }
                            onValueChange={(value) =>
                                setSchoolFilter(
                                    value === 'all' ? 'all' : Number(value),
                                )
                            }
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Semua sekolah" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua sekolah
                                </SelectItem>
                                {schoolOptions.map((school) => (
                                    <SelectItem
                                        key={school.id}
                                        value={String(school.id)}
                                    >
                                        {school.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <ConfirmBulkDeleteButton
                            count={selectedIds.length}
                            resourceLabelPlural="siswa"
                            disabled={selectedIds.length === 0}
                            onConfirm={handleBulkDelete}
                        />

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={selectedIds.length === 0}
                                >
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Reset Password ({selectedIds.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Reset password {selectedIds.length} siswa?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Semua siswa terpilih akan direset ke
                                        password default{' '}
                                        <span className="font-semibold">
                                            password
                                        </span>
                                        .
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Button
                                            type="button"
                                            onClick={handleBulkResetPassword}
                                        >
                                            Ya, reset
                                        </Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Siswa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalStudents}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Sekolah
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalSchools}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Rata-rata Siswa per Sekolah
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {avgStudentsPerSchool}
                        </CardContent>
                    </Card>
                </div>

                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-primary/10 dark:bg-primary/60">
                            <tr>
                                <th className="w-10 px-4 py-2">
                                    <Checkbox
                                        checked={checkboxValue}
                                        onCheckedChange={(value) =>
                                            handleToggleSelectAll(
                                                value === true,
                                            )
                                        }
                                        className="border-gray-900"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Nama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Sekolah
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                    Total Ujian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((s) => {
                                    const isSelected = selectedIds.includes(
                                        s.id,
                                    );

                                    return (
                                        <tr
                                            key={s.id}
                                            className={`transition-colors hover:bg-accent ${isSelected ? 'bg-accent' : ''} `}
                                        >
                                            <td className="w-10 px-4 py-2">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(value) =>
                                                        handleToggleSelectOne(
                                                            s.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className="px-6 py-2">
                                                {s.name || '-'}
                                            </td>

                                            <td className="px-6 py-2">
                                                <span className="font-mono text-sm">
                                                    {s.email || '-'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2">
                                                {s.school ? (
                                                    <Badge variant="outline">
                                                        {s.school.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2 text-center">
                                                {typeof s.total_exams ===
                                                'number' ? (
                                                    <span className="font-semibold">
                                                        {s.total_exams}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2">
                                                <div className="flex gap-2">
                                                    <ActionIconTooltip label="Lihat">
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="hover:bg-foreground/10"
                                                        >
                                                            <Link
                                                                href={`${baseUrl}/${s.id}`}
                                                                aria-label={`Lihat detail siswa ${s.name}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </ActionIconTooltip>

                                                    <ActionIconTooltip label="Edit">
                                                        <Button
                                                            asChild
                                                            size="icon"
                                                            variant="ghost"
                                                            className="hover:bg-foreground/10"
                                                        >
                                                            <Link
                                                                href={`${baseUrl}/${s.id}/edit`}
                                                                aria-label={`Edit data siswa ${s.name}`}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </ActionIconTooltip>

                                                    <ConfirmDeleteButton
                                                        deleteUrl={`${baseUrl}/${s.id}`}
                                                        resourceLabel="siswa"
                                                        itemName={s.name}
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
                                        className="px-6 py-8 text-center text-slate-500"
                                    >
                                        -
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedIds.length} dari {students.total} baris
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
                                    {students.current_page > 1 ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                students.current_page - 1
                                            }&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationPrevious />
                                        </Link>
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>

                                {getPaginationRange(
                                    students.current_page,
                                    students.last_page,
                                ).map((page) => (
                                    <PaginationItem key={page}>
                                        <Link
                                            href={`${baseUrl}?page=${page}&per_page=${rowsPerPage}`}
                                        >
                                            <PaginationLink
                                                isActive={
                                                    page ===
                                                    students.current_page
                                                }
                                            >
                                                {page}
                                            </PaginationLink>
                                        </Link>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {students.current_page <
                                    students.last_page ? (
                                        <Link
                                            href={`${baseUrl}?page=${
                                                students.current_page + 1
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
