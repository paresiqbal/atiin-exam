import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, FileDown, Mail, Search, User2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ActionIconTooltip from '@/components/ActionIconTooltip';
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
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface School {
  id: number;
  name: string;
}

interface University {
  id: number;
  name: string;
}

interface Major {
  id: number;
  name: string;
  minimum_passing_grade?: number | null;
}

interface Student {
  id: number;
  name: string;
  email: string;
  class?: string | null;
  school?: School | null;
  university?: University | null;
  major?: Major | null;
  created_at?: string;
}

interface Exam {
  id: number;
  name: string;
}

interface ExamAttempt {
  id: number;
  score: number;
  total_score: number;
  started_at?: string | null;
  completed_at?: string | null;
  exam: Exam;
  download_url: string;
}

interface StudentShowPageProps extends InertiaPageProps {
  student: Student;
  exam_attempts: ExamAttempt[];
}

const breadcrumbs = (student: Student): BreadcrumbItem[] => [
  { title: 'Admin Dashboard', href: '/admin/dashboard' },
  { title: 'Daftar Siswa', href: '/admin/students' },
  { title: student.name, href: `/admin/students/${student.id}` },
];

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentShow() {
  const { student, exam_attempts } = usePage<StudentShowPageProps>().props;

  const { totalExams, avgScore, lastExamAt, passedCount } = useMemo(() => {
    if (!exam_attempts || exam_attempts.length === 0) {
      return {
        totalExams: 0,
        avgScore: 0,
        lastExamAt: null as string | null,
        passedCount: 0,
      };
    }

    const sorted = [...exam_attempts].sort((a, b) => {
      const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return db - da;
    });

    const last = sorted[0];

    const percentages = exam_attempts.map((a) =>
      a.total_score > 0 ? (a.score / a.total_score) * 100 : 0,
    );

    const avg = percentages.reduce((sum, v) => sum + v, 0) / percentages.length;

    const passingGrade = student.major?.minimum_passing_grade ?? 0;
    const passed = exam_attempts.filter((a) => a.score >= passingGrade).length;

    return {
      totalExams: exam_attempts.length,
      avgScore: avg,
      lastExamAt: last.completed_at ?? last.started_at ?? null,
      passedCount: passed,
    };
  }, [exam_attempts, student.major?.minimum_passing_grade]);

  const passRate =
    totalExams > 0 ? ((passedCount / totalExams) * 100).toFixed(1) : '0.0';

  const [attemptSearch, setAttemptSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const filteredAttempts = useMemo(() => {
    if (!exam_attempts) return [];
    const q = attemptSearch.toLowerCase();

    return exam_attempts.filter((a) => {
      const examName = a.exam.name.toLowerCase();
      const dateStr = formatDateTime(a.completed_at ?? a.started_at).toLowerCase();
      const scoreStr = `${a.score}/${a.total_score}`.toLowerCase();

      return examName.includes(q) || dateStr.includes(q) || scoreStr.includes(q);
    });
  }, [exam_attempts, attemptSearch]);

  const totalPages =
    filteredAttempts.length > 0 ? Math.ceil(filteredAttempts.length / perPage) : 1;

  const paginatedAttempts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return filteredAttempts.slice(start, end);
  }, [filteredAttempts, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttemptSearch(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(student)}>
      <Head title={`Detail Siswa - ${student.name}`} />

      <div className="space-y-6 p-4">
        {/* Header (Back button top-right) */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Detail Siswa</h1>
            <p className="text-muted-foreground">
              Profil lengkap siswa dan riwayat ujian
            </p>
          </div>

          <div className="flex items-center gap-2 md:pt-1">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/students">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          {/* Student info card (bigger bio, simpler) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User2 className="h-5 w-5 text-primary" />
                    </span>

                    <div className="min-w-0">
                      <div className="truncate text-2xl font-bold">
                        {student.name}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Student ID: <span className="font-mono">{student.id}</span>
                      </div>
                    </div>
                  </CardTitle>
                </div>

                <Badge variant="outline" className="shrink-0">
                  {student.created_at
                    ? `Terdaftar ${formatDateTime(student.created_at)}`
                    : 'Terdaftar -'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Email row (no boxed card) */}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate font-mono text-base">{student.email}</span>
              </div>

              {/* Only School + Class (removed University & Jurusan) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Sekolah
                  </div>
                  <div className="text-sm">
                    {student.school ? (
                      <span className="font-medium">{student.school.name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Tidak ada sekolah
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Kelas
                  </div>
                  <div className="text-sm">
                    {student.class ? (
                      <span className="font-medium">{student.class}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats card */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Performa Ujian</CardTitle>
              <CardDescription>
                Statistik dari semua ujian yang pernah diikuti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Total Ujian
                  </div>
                  <div className="text-3xl font-bold">{totalExams}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Rata-rata Nilai
                  </div>
                  <div className="text-3xl font-bold">
                    {totalExams > 0 ? `${avgScore.toFixed(2)}%` : '-'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Persentase Lulus
                  </div>
                  <div className="text-3xl font-bold">
                    {totalExams > 0 ? `${passRate}%` : '-'}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Terakhir ujian: {lastExamAt ? formatDateTime(lastExamAt) : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam history table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Ujian</CardTitle>
            <CardDescription>
              Daftar semua ujian yang pernah diikuti siswa ini
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Search */}
            {exam_attempts && exam_attempts.length > 0 && (
              <div className="mb-4 flex items-center">
                <InputGroup className="flex-1">
                  <InputGroupAddon>
                    <Search className="h-4 w-4 text-slate-500" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Cari ujian berdasarkan nama, tanggal, atau skor..."
                    value={attemptSearch}
                    onChange={handleSearchChange}
                  />
                  {attemptSearch !== '' && (
                    <InputGroupAddon align="inline-end">
                      {filteredAttempts.length} hasil
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>
            )}

            {(!exam_attempts || exam_attempts.length === 0) && (
              <div className="py-10 text-center text-muted-foreground">
                Belum ada riwayat ujian untuk siswa ini.
              </div>
            )}

            {exam_attempts && exam_attempts.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ujian</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center">Skor</TableHead>
                        <TableHead className="text-center">Persentase</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedAttempts.map((attempt) => {
                        const percentage =
                          attempt.total_score > 0
                            ? (attempt.score / attempt.total_score) * 100
                            : 0;

                        const passingGrade =
                          student.major?.minimum_passing_grade ?? 0;

                        const isPassed = attempt.score >= passingGrade;

                        return (
                          <TableRow key={attempt.id}>
                            <TableCell>
                              <div className="font-medium">{attempt.exam.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Attempt ID: {attempt.id}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm">
                                {formatDateTime(attempt.completed_at ?? attempt.started_at)}
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              {attempt.score}/{attempt.total_score}
                            </TableCell>

                            <TableCell className="text-center">
                              {percentage.toFixed(2)}%
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant={isPassed ? 'default' : 'outline'}
                                className={
                                  isPassed
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : ''
                                }
                              >
                                {isPassed ? 'Lulus' : 'Tidak Lulus'}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <ActionIconTooltip label="Download">
                                  <Button
                                    asChild
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-foreground/10"
                                  >
                                    <a
                                      href={`/admin/attempts/${attempt.id}/download-pdf`}
                                      aria-label={`Download hasil ujian #${attempt.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileDown className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </ActionIconTooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      Halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
