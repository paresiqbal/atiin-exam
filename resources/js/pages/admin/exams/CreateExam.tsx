// resources/js/pages/admin/exams/CreateExam.tsx

// react / inertia
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
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

// utils / icons
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';

// types
import { BreadcrumbItem } from '@/types';

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
        question_bank_id: '',
        start_at: '',
        end_at: '',
        time_limit_minutes: '90',
        shuffle_questions: true,
        allow_review: true,
        school_id: '',
        class: '',
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/exams');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Ujian', href: '/admin/exams' },
        { title: 'Buat Ujian', href: '/admin/exams/create' },
    ];

    const selectedSchool = schools.find(
        (s) => s.id.toString() === data.school_id,
    );
    const selectedBank = questionBanks.find(
        (qb) => qb.id.toString() === data.question_bank_id,
    );

    // Filtered lists (simple substring search)
    const filteredSchools = schools.filter((s) =>
        s.name.toLowerCase().includes(schoolSearch.toLowerCase()),
    );

    const filteredClasses = classes.filter((c) =>
        c.toLowerCase().includes(classSearch.toLowerCase()),
    );

    const filteredQuestionBanks = questionBanks.filter((qb) =>
        qb.name.toLowerCase().includes(bankSearch.toLowerCase()),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Ujian" />
            <div className="p-4">
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

                            {/* Sekolah (custom searchable dropdown) */}
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
                                                                className={cn(
                                                                    'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent',
                                                                )}
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

                            {/* Kelas (custom searchable dropdown) */}
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
                                                                className={cn(
                                                                    'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent',
                                                                )}
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

                            {/* Bank soal (custom searchable dropdown + question count) */}
                            <div className="space-y-2">
                                <Label htmlFor="question_bank_id">
                                    Bank Soal *
                                </Label>
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
                                                errors.question_bank_id &&
                                                    'border-red-500',
                                            )}
                                        >
                                            {selectedBank ? (
                                                <>
                                                    {selectedBank.name}
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (
                                                        {
                                                            selectedBank.questions_count
                                                        }{' '}
                                                        soal)
                                                    </span>
                                                </>
                                            ) : (
                                                'Pilih bank soal'
                                            )}
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
                                                        Bank soal tidak
                                                        ditemukan.
                                                    </p>
                                                ) : (
                                                    filteredQuestionBanks.map(
                                                        (qb) => (
                                                            <button
                                                                key={qb.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setData(
                                                                        'question_bank_id',
                                                                        qb.id.toString(),
                                                                    );
                                                                    setBankOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent',
                                                                )}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        data.question_bank_id ===
                                                                            qb.id.toString()
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0',
                                                                    )}
                                                                />
                                                                <span>
                                                                    {qb.name}
                                                                </span>
                                                                <span className="ml-2 text-xs text-muted-foreground">
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
                                {errors.question_bank_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.question_bank_id}
                                    </p>
                                )}
                            </div>

                            {/* Start / End with shadcn date picker + time */}
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
                                                        startDate.toLocaleDateString()
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
                                                        !startDate &&
                                                            'text-muted-foreground',
                                                        errors.start_at &&
                                                            'border-red-500',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? (
                                                        endDate.toLocaleDateString()
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

                            {/* Time limit */}
                            <div className="space-y-2">
                                <Label htmlFor="time_limit_minutes">
                                    Batas Waktu (menit) *
                                </Label>
                                <Input
                                    id="time_limit_minutes"
                                    type="number"
                                    min="1"
                                    max="300"
                                    value={data.time_limit_minutes}
                                    onChange={(e) =>
                                        setData(
                                            'time_limit_minutes',
                                            e.target.value,
                                        )
                                    }
                                    className={cn(
                                        errors.time_limit_minutes &&
                                            'border-red-500',
                                    )}
                                />

                                {errors.time_limit_minutes && (
                                    <p className="text-sm text-red-500">
                                        {errors.time_limit_minutes}
                                    </p>
                                )}
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
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
