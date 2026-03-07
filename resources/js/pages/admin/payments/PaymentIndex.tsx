import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import ExtendProDialog from '@/components/ExtendProDialog';
import SetPlanDialog from '@/components/SetPlanDialog';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Gem, Search } from 'lucide-react';

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
}

type AccountType = 'regular' | 'pro';

interface StudentAccountRow {
    id: number;
    name: string;
    email: string;
    account_type: AccountType;
    pro_expires_at?: string | null;
    school?: School | null;
    university?: University | null;
    major?: Major | null;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface AccountsPageProps extends InertiaPageProps {
    students: Paginated<StudentAccountRow>;
    schools: School[];
    classes: string[];
    filters?: {
        search?: string | null;
        account_type?: string | null;
        school_id?: string | number | null;
        class?: string | null;
        per_page?: number | null;
    };
    stats?: {
        total: number;
        pro: number;
        regular: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Akun Siswa', href: '/admin/payments' },
];

// IMPORTANT: match your GET route
const baseUrl = '/admin/payments';

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
}

function isExpired(dateStr?: string | null) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
}

function makeQuery({
    page,
    perPage,
    search,
    accountType,
    schoolId,
    classFilter,
}: {
    page: number;
    perPage: number;
    search: string;
    accountType: string; // 'all' | 'regular' | 'pro'
    schoolId: string;
    classFilter: string;
}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (search.trim() !== '') params.set('search', search.trim());
    if (accountType !== 'all') params.set('account_type', accountType);
    if (schoolId !== 'all') params.set('school_id', schoolId);
    if (classFilter !== 'all') params.set('class', classFilter);
    return `${baseUrl}?${params.toString()}`;
}

export default function PaymentIndex() {
    const { students, schools, classes, filters, stats } =
        usePage<AccountsPageProps>().props;
    const data = useMemo(() => students.data ?? [], [students.data]);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [accountType, setAccountType] = useState<string>(
        filters?.account_type ?? 'all',
    );
    const [schoolId, setSchoolId] = useState<string>(
        filters?.school_id ? String(filters.school_id) : 'all',
    );
    const [classFilter, setClassFilter] = useState<string>(
        filters?.class ?? 'all',
    );
    const [rowsPerPage, setRowsPerPage] = useState<number>(
        (filters?.per_page ?? students.per_page ?? 20) as number,
    );
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Live search (debounced)
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const t = setTimeout(() => {
            router.get(
                baseUrl,
                {
                    search: search.trim() || undefined,
                    account_type:
                        accountType === 'all' ? undefined : accountType,
                    school_id: schoolId === 'all' ? undefined : schoolId,
                    class: classFilter === 'all' ? undefined : classFilter,
                    page: 1,
                    per_page: rowsPerPage,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 350);

        return () => clearTimeout(t);
    }, [search, accountType, schoolId, classFilter, rowsPerPage]);

    const total = stats?.total ?? students.total ?? data.length;
    const totalPro = stats?.pro ?? 0;
    const totalRegular = stats?.regular ?? 0;

    const handleTogglePro = (id: number) => {
        router.post(
            `/admin/students/${id}/toggle-pro`,
            {},
            { preserveScroll: true },
        );
    };

    const handleExtendPro = (id: number, months: number) => {
        router.post(
            `/admin/students/${id}/extend-pro`,
            { months },
            { preserveScroll: true },
        );
    };

    const handleUpdateAccountType = (
        id: number,
        payload: { account_type: AccountType; pro_expires_at?: string | null },
    ) => {
        router.post(`/admin/students/${id}/account-type`, payload, {
            preserveScroll: true,
        });
    };

    const handleChangeRowsPerPage = (value: string) => {
        const perPage = Number(value) || 20;
        setRowsPerPage(perPage);

        router.get(
            baseUrl,
            {
                search: search.trim() || undefined,
                account_type: accountType === 'all' ? undefined : accountType,
                school_id: schoolId === 'all' ? undefined : schoolId,
                class: classFilter === 'all' ? undefined : classFilter,
                page: 1,
                per_page: perPage,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Akun Siswa" />

            <TooltipProvider delayDuration={150}>
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Akun Siswa</h1>
                            <p className="text-sm text-muted-foreground">
                                Kelola status Regular / Pro, masa aktif, dan
                                perpanjangan.
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2">
                            <InputGroup className="flex-1">
                                <InputGroupAddon>
                                    <Search className="h-4 w-4 text-slate-500" />
                                </InputGroupAddon>

                                <InputGroupInput
                                    placeholder="Cari nama atau email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                {search !== '' && (
                                    <InputGroupAddon align="inline-end">
                                        {total} hasil
                                    </InputGroupAddon>
                                )}
                            </InputGroup>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={accountType}
                                onValueChange={setAccountType}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Semua akun" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="regular">
                                        Regular
                                    </SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={schoolId}
                                onValueChange={setSchoolId}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Semua sekolah" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Sekolah
                                    </SelectItem>
                                    {schools.map((school) => (
                                        <SelectItem
                                            key={school.id}
                                            value={String(school.id)}
                                        >
                                            {school.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={classFilter}
                                onValueChange={setClassFilter}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Semua kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kelas
                                    </SelectItem>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls} value={cls}>
                                            {cls}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Total Siswa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold">
                                {total}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Siswa Pro
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold">
                                {totalPro}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Siswa Reguler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold">
                                {totalRegular}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-muted-foreground">
                            {selectedIds.length} dipilih
                        </div>
                        {(() => {
                            const selectedStudents = data.filter((s) =>
                                selectedIds.includes(s.id),
                            );
                            const allPro =
                                selectedStudents.length > 0 &&
                                selectedStudents.every(
                                    (s) => s.account_type === 'pro',
                                );
                            const nextType = allPro ? 'regular' : 'pro';
                            const label = allPro
                                ? 'Set Regular untuk Terpilih'
                                : 'Set Pro untuk Terpilih';

                            return (
                                <Button
                                    variant="outline"
                                    disabled={selectedIds.length === 0}
                                    onClick={() =>
                                        router.post(
                                            '/admin/students/bulk-account-type',
                                            {
                                                student_ids: selectedIds,
                                                account_type: nextType,
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    {label}
                                </Button>
                            );
                        })()}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-primary/10 dark:bg-primary/60">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        <Checkbox
                                            checked={
                                                data.length > 0 &&
                                                data.every((s) =>
                                                    selectedIds.includes(s.id),
                                                )
                                            }
                                            onCheckedChange={() => {
                                                if (
                                                    data.length > 0 &&
                                                    data.every((s) =>
                                                        selectedIds.includes(
                                                            s.id,
                                                        ),
                                                    )
                                                ) {
                                                    setSelectedIds([]);
                                                    return;
                                                }
                                                setSelectedIds(
                                                    data.map((s) => s.id),
                                                );
                                            }}
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Masa Aktif Pro
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {data.length > 0 ? (
                                    data.map((s) => {
                                        const expired = isExpired(
                                            s.pro_expires_at,
                                        );
                                        const isPro = s.account_type === 'pro';

                                        const rowClass =
                                            isPro && expired
                                                ? 'bg-destructive/5 hover:bg-destructive/10'
                                                : isPro
                                                  ? 'bg-primary/5 hover:bg-primary/10'
                                                  : 'hover:bg-accent';

                                        return (
                                            <tr
                                                key={s.id}
                                                className={`transition-colors ${rowClass}`}
                                            >
                                                <td className="px-6 py-2">
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            s.id,
                                                        )}
                                                        onCheckedChange={() => {
                                                            setSelectedIds(
                                                                (prev) =>
                                                                    prev.includes(
                                                                        s.id,
                                                                    )
                                                                        ? prev.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  s.id,
                                                                          )
                                                                        : [
                                                                              ...prev,
                                                                              s.id,
                                                                          ],
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-2">
                                                    <div className="font-medium">
                                                        {s.name || '-'}
                                                    </div>
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

                                                <td className="px-6 py-2">
                                                    {isPro ? (
                                                        <Badge>Pro</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Regular
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="px-6 py-2">
                                                    {isPro ? (
                                                        s.pro_expires_at ? (
                                                            <Badge
                                                                variant={
                                                                    expired
                                                                        ? 'destructive'
                                                                        : 'outline'
                                                                }
                                                            >
                                                                {formatDate(
                                                                    s.pro_expires_at,
                                                                )}
                                                                {expired
                                                                    ? ' (kedaluwarsa)'
                                                                    : ''}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                -
                                                            </Badge>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    size="icon"
                                                                    variant={
                                                                        isPro
                                                                            ? 'default'
                                                                            : 'secondary'
                                                                    }
                                                                    onClick={() =>
                                                                        handleTogglePro(
                                                                            s.id,
                                                                        )
                                                                    }
                                                                    aria-label={
                                                                        isPro
                                                                            ? 'Ubah ke Regular'
                                                                            : 'Ubah ke Pro'
                                                                    }
                                                                >
                                                                    <Gem className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                {isPro
                                                                    ? 'Ubah ke Regular'
                                                                    : 'Ubah ke Pro'}
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <ExtendProDialog
                                                            disabled={!isPro}
                                                            onExtend={(
                                                                months,
                                                            ) =>
                                                                handleExtendPro(
                                                                    s.id,
                                                                    months,
                                                                )
                                                            }
                                                        />

                                                        <SetPlanDialog
                                                            currentType={
                                                                s.account_type
                                                            }
                                                            currentExpiry={
                                                                s.pro_expires_at ??
                                                                null
                                                            }
                                                            onSave={(payload) =>
                                                                handleUpdateAccountType(
                                                                    s.id,
                                                                    payload,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-8 text-center text-slate-500"
                                        >
                                            Tidak ada data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer nav */}
                    <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {data.length} baris • Total{' '}
                            {students.total}
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
                                        <a
                                            href={makeQuery({
                                                page:
                                                    students.current_page -
                                                    1,
                                                perPage: rowsPerPage,
                                                search,
                                                accountType,
                                                schoolId,
                                                classFilter,
                                            })}
                                        >
                                                <PaginationPrevious />
                                            </a>
                                        ) : (
                                            <PaginationPrevious className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>

                                    {Array.from(
                                        { length: students.last_page },
                                        (_, i) => i + 1,
                                    ).map((page) => (
                                        <PaginationItem key={page}>
                                            <a
                                                href={makeQuery({
                                                    page,
                                                    perPage: rowsPerPage,
                                                    search,
                                                    accountType,
                                                    schoolId,
                                                    classFilter,
                                                })}
                                            >
                                                <PaginationLink
                                                    isActive={
                                                        page ===
                                                        students.current_page
                                                    }
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </a>
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        {students.current_page <
                                        students.last_page ? (
                                            <a
                                                href={makeQuery({
                                                    page:
                                                        students.current_page +
                                                        1,
                                                    perPage: rowsPerPage,
                                                    search,
                                                    accountType,
                                                    schoolId,
                                                    classFilter,
                                                })}
                                            >
                                                <PaginationNext />
                                            </a>
                                        ) : (
                                            <PaginationNext className="pointer-events-none opacity-50" />
                                        )}
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}
