import { Head, router, usePage } from '@inertiajs/react';
import { ClockArrowUp, Gem, Hourglass, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/pagination';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface AccountsPageProps extends InertiaPageProps {
    students: Paginated<StudentAccountRow>;
    filters?: {
        search?: string | null;
        account_type?: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Akun Siswa', href: '/admin/students/accounts' },
];

const baseUrl = '/admin/students/accounts';

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

export default function PaymentIndex() {
    const { students, filters } = usePage<AccountsPageProps>().props;
    const data = useMemo(() => students.data ?? [], [students.data]);

    // server-driven filters
    const [search, setSearch] = useState(filters?.search ?? '');
    const [accountType, setAccountType] = useState<string>(
        filters?.account_type ?? 'all',
    );

    const applyFilters = (
        next?: Partial<{ search: string; account_type: string }>,
    ) => {
        const nextSearch = next?.search ?? search;
        const nextAccountType = next?.account_type ?? accountType;

        router.get(
            baseUrl,
            {
                search: nextSearch,
                account_type: nextAccountType === 'all' ? '' : nextAccountType,
                page: 1,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    // stats
    const total = students.total ?? data.length;
    const totalPage = data.length;

    const totalPro = useMemo(
        () => data.filter((s) => s.account_type === 'pro').length,
        [data],
    );
    const totalRegular = useMemo(
        () => data.filter((s) => s.account_type === 'regular').length,
        [data],
    );

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Akun Siswa" />

            <div className="space-y-6 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Akun Siswa</h1>
                        <p className="text-muted-foreground">
                            Kelola status Regular / Pro, masa aktif, dan
                            perpanjangan.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-0 py-0">
                        <InputGroup className="flex-1">
                            <InputGroupAddon>
                                <Search className="h-4 w-4 text-slate-500" />
                            </InputGroupAddon>

                            <InputGroupInput
                                placeholder="Cari nama atau email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter')
                                        applyFilters({ search });
                                }}
                            />

                            <InputGroupAddon align="inline-end">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => applyFilters({ search })}
                                >
                                    Cari
                                </Button>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={accountType}
                            onValueChange={(value) => {
                                setAccountType(value);
                                applyFilters({ account_type: value });
                            }}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Semua akun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                        </Select>
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
                            {total}
                        </CardContent>
                        <p className="px-6 pb-4 text-xs text-muted-foreground">
                            Total semua siswa (paginate)
                        </p>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Siswa (Halaman Ini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalPage}
                        </CardContent>
                        <p className="px-6 pb-4 text-xs text-muted-foreground">
                            Jumlah yang tampil saat ini
                        </p>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Pro (Halaman Ini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalPro}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Regular (Halaman Ini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-3xl font-bold">
                            {totalRegular}
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <TooltipProvider delayDuration={150}>
                        <table className="w-full text-sm">
                            <thead className="border-b bg-accent">
                                <tr>
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

                                        return (
                                            <tr
                                                key={s.id}
                                                className="transition-colors hover:bg-accent"
                                            >
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
                                                        {/* Toggle Pro */}
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
                                                                    <Gem
                                                                        className={
                                                                            isPro
                                                                                ? 'h-4 w-4 text-white'
                                                                                : 'h-4 w-4 text-slate-700'
                                                                        }
                                                                    />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                {isPro
                                                                    ? 'Ubah ke Regular'
                                                                    : 'Ubah ke Pro'}
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        {/* Extend */}
                                                        <ExtendDialog
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

                                                        {/* Set Plan */}
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
                                            colSpan={6}
                                            className="px-6 py-8 text-center text-slate-500"
                                        >
                                            -
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TooltipProvider>
                </div>

                {/* Footer info */}
                <div className="text-sm text-muted-foreground">
                    Menampilkan {data.length} dari total {total} siswa.
                </div>
            </div>
        </AppLayout>
    );
}

function ExtendDialog({
    disabled,
    onExtend,
}: {
    disabled?: boolean;
    onExtend: (months: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [months, setMonths] = useState('1');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <TooltipProvider delayDuration={150}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                disabled={disabled}
                                aria-label="Perpanjang Pro"
                            >
                                <ClockArrowUp className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Perpanjang Pro
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Perpanjang Pro</DialogTitle>
                    <DialogDescription>
                        Tambah masa aktif Pro (dalam bulan).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select value={months} onValueChange={setMonths}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (m) => (
                                    <SelectItem key={m} value={String(m)}>
                                        {m} bulan
                                    </SelectItem>
                                ),
                            )}
                            <SelectItem value="24">24 bulan</SelectItem>
                            <SelectItem value="36">36 bulan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={() => {
                            onExtend(Number(months));
                            setOpen(false);
                        }}
                    >
                        Perpanjang
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SetPlanDialog({
    currentType,
    currentExpiry,
    onSave,
}: {
    currentType: AccountType;
    currentExpiry: string | null;
    onSave: (payload: {
        account_type: AccountType;
        pro_expires_at?: string | null;
    }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<AccountType>(currentType);
    const [expiry, setExpiry] = useState<string>(currentExpiry ?? '');

    const dateValue = useMemo(() => {
        if (!expiry) return '';
        const d = new Date(expiry);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, [expiry]);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (v) {
                    setType(currentType);
                    setExpiry(currentExpiry ?? '');
                }
            }}
        >
            <DialogTrigger asChild>
                <TooltipProvider delayDuration={150}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                aria-label="Atur tipe akun"
                            >
                                <Hourglass className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Atur Tipe Akun
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Atur Tipe Akun</DialogTitle>
                    <DialogDescription>
                        Ubah manual Regular / Pro dan tanggal berakhir
                        (opsional).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tipe Akun</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as AccountType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Tanggal Berakhir Pro (opsional)
                            <span className="ml-2 text-xs text-muted-foreground">
                                (kosongkan untuk tanpa batas)
                            </span>
                        </Label>

                        <Input
                            type="date"
                            value={type === 'pro' ? dateValue : ''}
                            disabled={type !== 'pro'}
                            onChange={(e) => setExpiry(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={() => {
                            onSave({
                                account_type: type,
                                pro_expires_at:
                                    type === 'pro' ? expiry || null : null,
                            });
                            setOpen(false);
                        }}
                    >
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
