'use client';

import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

import {
    ArrowDown,
    ArrowUp,
    CalendarIcon,
    Check,
    ChevronsUpDown,
    GripVertical,
} from 'lucide-react';

interface QuestionBank {
    id: number;
    name: string;
    questions_count: number;
}

interface School {
    id: number;
    name: string;
}

interface Props {
    questionBanks: QuestionBank[];
    schools: School[];
    classes: string[];
}

type SelectedBank = {
    id: number;
    duration_minutes: number;
    sort_order: number;
};

function combineDateTime(date: Date | undefined, time: string): string {
    if (!date || !time) return '';
    const [hours, minutes] = time.split(':');
    const d = new Date(date);
    d.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hh}:${mm}`;
}

export default function CreateExam({ questionBanks, schools, classes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        start_at: '',
        end_at: '',
        shuffle_questions: true,
        allow_review: true,
        school_id: '',
        class: '',
        question_banks: [] as SelectedBank[],
    });

    // Date/time state
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    // Dropdown open state
    const [schoolOpen, setSchoolOpen] = useState(false);
    const [classOpen, setClassOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);

    // Search text
    const [schoolSearch, setSchoolSearch] = useState('');
    const [classSearch, setClassSearch] = useState('');
    const [bankSearch, setBankSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Ujian', href: '/admin/exams' },
        { title: 'Buat Ujian', href: '/admin/exams/create' },
    ];

    const selectedSchool = schools.find(
        (s) => s.id.toString() === data.school_id,
    );

    const selectedBankIds = useMemo(
        () => new Set(data.question_banks.map((b) => b.id)),
        [data.question_banks],
    );

    const totalMinutes = useMemo(
        () =>
            data.question_banks.reduce(
                (sum, b) => sum + (Number(b.duration_minutes) || 0),
                0,
            ),
        [data.question_banks],
    );

    // Filtered lists (simple substring search)
    const filteredSchools = schools.filter((s) =>
        s.name.toLowerCase().includes(schoolSearch.toLowerCase()),
    );

    const filteredClasses = classes.filter((c) =>
        c.toLowerCase().includes(classSearch.toLowerCase()),
    );

    const filteredQuestionBanks = questionBanks
        .filter((qb) => !selectedBankIds.has(qb.id))
        .filter((qb) =>
            qb.name.toLowerCase().includes(bankSearch.toLowerCase()),
        );

    const normalizeSortOrder = (banks: SelectedBank[]) =>
        banks.map((b, i) => ({ ...b, sort_order: i + 1 }));

    const moveBank = (id: number, direction: 'up' | 'down') => {
        const idx = data.question_banks.findIndex((b) => b.id === id);
        if (idx === -1) return;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= data.question_banks.length) return;

        const next = [...data.question_banks];
        const temp = next[idx];
        next[idx] = next[targetIdx];
        next[targetIdx] = temp;

        setData('question_banks', normalizeSortOrder(next));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure sort_order always matches current UI order
        setData('question_banks', normalizeSortOrder([...data.question_banks]));
        post('/admin/exams');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Ujian" />
            <div className="p-4">
                {/* keep original style: don't change width */}
                <Card className="mx-auto max-w-screen">
                    <CardHeader>
                        <CardTitle>Buat Ujian Baru</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nama ujian */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ujian *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Masukkan nama ujian"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={cn(
                                        errors.name && 'border-red-500',
                                    )}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Masukkan deskripsi ujian"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className={cn(
                                        errors.description && 'border-red-500',
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Sekolah */}
                            <div className="space-y-2">
                                <Label htmlFor="school_id">Sekolah *</Label>
                                <Popover
                                    open={schoolOpen}
                                    onOpenChange={setSchoolOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-between',
                                                errors.school_id &&
                                                    'border-red-500',
                                            )}
                                        >
                                            {selectedSchool
                                                ? selectedSchool.name
                                                : 'Pilih sekolah'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Cari sekolah..."
                                                value={schoolSearch}
                                                onChange={(e) =>
                                                    setSchoolSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <div className="max-h-60 overflow-y-auto rounded-md border">
                                                {filteredSchools.length ===
                                                0 ? (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                                        Sekolah tidak ditemukan.
                                                    </p>
                                                ) : (
                                                    filteredSchools.map(
                                                        (school) => (
                                                            <button
                                                                key={school.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData(
                                                                        'school_id',
                                                                        school.id.toString(),
                                                                    );
                                                                    setSchoolOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                                className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        data.school_id ===
                                                                            school.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                <span>
                                                                    {
                                                                        school.name
                                                                    }
                                                                </span>
                                                            </button>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {errors.school_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.school_id}
                                    </p>
                                )}
                            </div>

                            {/* Kelas */}
                            <div className="space-y-2">
                                <Label htmlFor="class">Kelas *</Label>
                                <Popover
                                    open={classOpen}
                                    onOpenChange={setClassOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-between',
                                                errors.class &&
                                                    'border-red-500',
                                            )}
                                        >
                                            {data.class || 'Pilih kelas'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Cari kelas..."
                                                value={classSearch}
                                                onChange={(e) =>
                                                    setClassSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <div className="max-h-60 overflow-y-auto rounded-md border">
                                                {filteredClasses.length ===
                                                0 ? (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                                        Kelas tidak ditemukan.
                                                    </p>
                                                ) : (
                                                    filteredClasses.map(
                                                        (cls) => (
                                                            <button
                                                                key={cls}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData(
                                                                        'class',
                                                                        cls,
                                                                    );
                                                                    setClassOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                                className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        data.class ===
                                                                            cls
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                <span>
                                                                    {cls}
                                                                </span>
                                                            </button>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {errors.class && (
                                    <p className="text-sm text-red-500">
                                        {errors.class}
                                    </p>
                                )}
                            </div>

                            {/* Bank Soal (multi-select + duration + reorder) */}
                            <div className="space-y-2">
                                <Label>Bank Soal *</Label>

                                <Popover
                                    open={bankOpen}
                                    onOpenChange={setBankOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-between',
                                                errors.question_banks &&
                                                    'border-red-500',
                                            )}
                                        >
                                            Tambah bank soal
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        align="start"
                                        className="w-[var(--radix-popover-trigger-width)] p-2"
                                    >
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Cari bank soal..."
                                                value={bankSearch}
                                                onChange={(e) =>
                                                    setBankSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <div className="max-h-60 overflow-y-auto rounded-md border">
                                                {filteredQuestionBanks.length ===
                                                0 ? (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                                        Tidak ada bank soal
                                                        (atau sudah dipilih
                                                        semua).
                                                    </p>
                                                ) : (
                                                    filteredQuestionBanks.map(
                                                        (qb) => (
                                                            <button
                                                                key={qb.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const next =
                                                                        normalizeSortOrder(
                                                                            [
                                                                                ...data.question_banks,
                                                                                {
                                                                                    id: qb.id,
                                                                                    duration_minutes: 30,
                                                                                    sort_order:
                                                                                        data
                                                                                            .question_banks
                                                                                            .length +
                                                                                        1,
                                                                                },
                                                                            ],
                                                                        );

                                                                    setData(
                                                                        'question_banks',
                                                                        next,
                                                                    );
                                                                    setBankOpen(
                                                                        false,
                                                                    );
                                                                    setBankSearch(
                                                                        '',
                                                                    );
                                                                }}
                                                                className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                                                            >
                                                                <span className="flex-1">
                                                                    {qb.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    (
                                                                    {
                                                                        qb.questions_count
                                                                    }{' '}
                                                                    soal)
                                                                </span>
                                                            </button>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {errors.question_banks && (
                                    <p className="text-sm text-red-500">
                                        {errors.question_banks as any}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {data.question_banks.length === 0 ? (
                                        <div className="rounded-md border p-3 text-sm text-muted-foreground">
                                            Belum ada bank soal dipilih.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {data.question_banks.map(
                                                (item, idx) => {
                                                    const qb =
                                                        questionBanks.find(
                                                            (q) =>
                                                                q.id ===
                                                                item.id,
                                                        );

                                                    const isFirst = idx === 0;
                                                    const isLast =
                                                        idx ===
                                                        data.question_banks
                                                            .length -
                                                            1;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center"
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {idx +
                                                                            1}
                                                                        .{' '}
                                                                        {qb?.name ??
                                                                            `Bank #${item.id}`}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {qb?.questions_count ??
                                                                            0}{' '}
                                                                        soal
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Reorder controls */}
                                                            <div className="ml-auto flex items-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="hover:bg-foreground/10"
                                                                    disabled={
                                                                        isFirst
                                                                    }
                                                                    onClick={() =>
                                                                        moveBank(
                                                                            item.id,
                                                                            'up',
                                                                        )
                                                                    }
                                                                    aria-label="Move up"
                                                                >
                                                                    <ArrowUp className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="hover:bg-foreground/10"
                                                                    disabled={
                                                                        isLast
                                                                    }
                                                                    onClick={() =>
                                                                        moveBank(
                                                                            item.id,
                                                                            'down',
                                                                        )
                                                                    }
                                                                    aria-label="Move down"
                                                                >
                                                                    <ArrowDown className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            {/* Duration (primary background) */}
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-muted-foreground">
                                                                    Durasi
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={300}
                                                                    value={
                                                                        item.duration_minutes
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                            1;

                                                                        const next =
                                                                            data.question_banks.map(
                                                                                (
                                                                                    b,
                                                                                ) =>
                                                                                    b.id ===
                                                                                    item.id
                                                                                        ? {
                                                                                              ...b,
                                                                                              duration_minutes:
                                                                                                  value,
                                                                                          }
                                                                                        : b,
                                                                            );

                                                                        setData(
                                                                            'question_banks',
                                                                            next,
                                                                        );
                                                                    }}
                                                                    className={cn(
                                                                        'w-[110px] bg-primary text-primary-foreground placeholder:text-primary-foreground/70',
                                                                        'focus-visible:ring-primary/30',
                                                                    )}
                                                                />
                                                                <span className="text-sm text-muted-foreground">
                                                                    menit
                                                                </span>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const next =
                                                                            normalizeSortOrder(
                                                                                data.question_banks.filter(
                                                                                    (
                                                                                        b,
                                                                                    ) =>
                                                                                        b.id !==
                                                                                        item.id,
                                                                                ),
                                                                            );

                                                                        setData(
                                                                            'question_banks',
                                                                            next,
                                                                        );
                                                                    }}
                                                                    className="hover:bg-foreground/10"
                                                                    aria-label="Remove bank"
                                                                >
                                                                    ✕
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Total duration (primary background) */}
                                <div className="rounded-md border bg-primary/10 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Total durasi ujian
                                        </span>
                                        <Badge className="bg-primary text-primary-foreground">
                                            {totalMinutes} menit
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Start / End with date picker + time */}
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Start */}
                                <div className="space-y-2">
                                    <Label>Dimulai di *</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'flex w-full justify-start text-left font-normal',
                                                        !startDate &&
                                                            'text-muted-foreground',
                                                        errors.start_at &&
                                                            'border-red-500',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? (
                                                        startDate.toLocaleDateString(
                                                            'id-ID',
                                                        )
                                                    ) : (
                                                        <span>
                                                            Pilih tanggal
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={(date) => {
                                                        setStartDate(date);
                                                        const final =
                                                            combineDateTime(
                                                                date,
                                                                startTime ||
                                                                    '00:00',
                                                            );
                                                        setData(
                                                            'start_at',
                                                            final,
                                                        );
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setStartTime(value);
                                                const final = combineDateTime(
                                                    startDate,
                                                    value,
                                                );
                                                setData('start_at', final);
                                            }}
                                            className={cn(
                                                'hidden w-[120px] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0',
                                                errors.start_at &&
                                                    'border-red-500',
                                            )}
                                        />
                                    </div>
                                    {errors.start_at && (
                                        <p className="text-sm text-red-500">
                                            {errors.start_at}
                                        </p>
                                    )}
                                </div>

                                {/* End */}
                                <div className="space-y-2">
                                    <Label>Berakhir di *</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'flex w-full justify-start text-left font-normal',
                                                        !endDate &&
                                                            'text-muted-foreground',
                                                        errors.end_at &&
                                                            'border-red-500',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? (
                                                        endDate.toLocaleDateString(
                                                            'id-ID',
                                                        )
                                                    ) : (
                                                        <span>
                                                            Pilih tanggal
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    onSelect={(date) => {
                                                        setEndDate(date);
                                                        const final =
                                                            combineDateTime(
                                                                date,
                                                                endTime ||
                                                                    '00:00',
                                                            );
                                                        setData(
                                                            'end_at',
                                                            final,
                                                        );
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setEndTime(value);
                                                const final = combineDateTime(
                                                    endDate,
                                                    value,
                                                );
                                                setData('end_at', final);
                                            }}
                                            className={cn(
                                                'hidden w-[120px] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0',
                                                errors.end_at &&
                                                    'border-red-500',
                                            )}
                                        />
                                    </div>
                                    {errors.end_at && (
                                        <p className="text-sm text-red-500">
                                            {errors.end_at}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Checkbox
                                        id="shuffle_questions"
                                        checked={data.shuffle_questions}
                                        onCheckedChange={(value) =>
                                            setData(
                                                'shuffle_questions',
                                                Boolean(value),
                                            )
                                        }
                                    />
                                    <Label htmlFor="shuffle_questions">
                                        Acak Soal
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <Checkbox
                                        id="allow_review"
                                        checked={data.allow_review}
                                        onCheckedChange={(value) =>
                                            setData(
                                                'allow_review',
                                                Boolean(value),
                                            )
                                        }
                                    />
                                    <Label htmlFor="allow_review">
                                        Izinkan Review
                                    </Label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Membuat...' : 'Buat Ujian'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Batal
                                </Button>
                            </div>

                            <div className="pt-2">
                                <Link
                                    href="/admin/exams"
                                    className="text-sm text-muted-foreground underline"
                                >
                                    Kembali ke daftar ujian
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
