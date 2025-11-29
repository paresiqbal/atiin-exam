// resources/js/pages/admin/students/Index.tsx

import { Head, Link, usePage } from '@inertiajs/react';
import { Edit2, Eye, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

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

export default function StudentIndex() {
    const { students } = usePage<StudentPageProps>().props;
    const data = useMemo(() => students.data ?? [], [students.data]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredStudents = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return data.filter((s) => {
            const schoolName = s.school?.name ?? '';

            return (
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                schoolName.toLowerCase().includes(q)
            );
        });
    }, [data, searchQuery]);

    const totalStudents = filteredStudents.length;

    const uniqueSchoolIds = new Set(
        filteredStudents
            .map((s) => s.school?.id)
            .filter((id): id is number => typeof id === 'number'),
    );

    const totalSchools = uniqueSchoolIds.size;

    const avgStudentsPerSchool =
        totalSchools > 0 ? (totalStudents / totalSchools).toFixed(1) : '0';

    const scoreValues = filteredStudents
        .map((s) => s.average_score)
        .filter((v): v is number => typeof v === 'number');

    const avgScoreOverall =
        scoreValues.length > 0
            ? (
                  scoreValues.reduce((sum, v) => sum + v, 0) /
                  scoreValues.length
              ).toFixed(2)
            : '0';
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Siswa" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Daftar Siswa</h1>
                        <p className="text-muted-foreground">
                            Kelola data siswa beserta sekolah dan nilai ujian
                        </p>
                    </div>

                    <div>
                        <Link href={`${baseUrl}/create`}>
                            <Button>Tambah Siswa</Button>
                        </Link>
                    </div>
                </div>

                {/* 🔍 Search bar */}
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
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Rata-rata Nilai
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {avgScoreOverall}%
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Siswa</CardTitle>
                        <CardDescription>
                            Daftar lengkap siswa dengan statistik ujian
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {filteredStudents.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">
                                Tidak ada siswa ditemukan
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Sekolah</TableHead>
                                            <TableHead className="text-center">
                                                Total Ujian
                                            </TableHead>
                                            <TableHead className="text-center">
                                                Rata-rata Nilai
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredStudents.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">
                                                    {s.name}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="font-mono text-sm">
                                                        {s.email}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    {s.school ? (
                                                        <Badge variant="outline">
                                                            {s.school.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Tidak ada sekolah
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <span className="font-semibold">
                                                        {s.total_exams}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    {typeof s.average_score ===
                                                    'number' ? (
                                                        <span
                                                            className={`font-semibold ${
                                                                s.average_score >=
                                                                70
                                                                    ? 'text-green-600'
                                                                    : s.average_score >=
                                                                        50
                                                                      ? 'text-yellow-600'
                                                                      : 'text-red-600'
                                                            }`}
                                                        >
                                                            {s.average_score.toFixed(
                                                                2,
                                                            )}
                                                            %
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
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

                                                        <ConfirmDeleteButton
                                                            deleteUrl={`${baseUrl}/${s.id}`}
                                                            resourceLabel="siswa"
                                                            itemName={s.name}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
