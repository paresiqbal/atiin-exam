import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

interface School {
    id: number;
    name: string;
}

interface QuestionBank {
    id: number;
    name: string;
}

interface ExamSettings {
    time_limit_minutes: number;
    shuffle_questions: boolean;
    allow_review: boolean;
}

interface ExamQuestionBankPivot {
    duration_minutes: number;
    sort_order: number;
}

interface ExamQuestionBank {
    id: number;
    name: string;
    pivot: ExamQuestionBankPivot;
}

interface ExamData {
    id: number;
    name: string;
    description: string | null;
    school_id: number;
    start_at: string; // "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
    end_at: string;
    settings: ExamSettings;
    question_banks: ExamQuestionBank[];
}

type FormBank = {
    id: string; // keep as string for Select
    duration_minutes: string; // input text
    sort_order: number;
};

interface Props {
    exam: ExamData;
    questionBanks: QuestionBank[];
    schools: School[];
}

function toDateTimeLocal(value: string): string {
    if (!value) return '';
    // Accept "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
    const normalized = value.replace(' ', 'T');
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
}

function fromDateTimeLocal(value: string): string {
    if (!value) return '';
    // browser gives "YYYY-MM-DDTHH:mm"
    return value.replace('T', ' ');
}

export default function EditExam({ exam, questionBanks, schools }: Props) {
    const initialBanks: FormBank[] = (exam.question_banks ?? [])
        .slice()
        .sort((a, b) => (a.pivot?.sort_order ?? 0) - (b.pivot?.sort_order ?? 0))
        .map((b, idx) => ({
            id: String(b.id),
            duration_minutes: String(b.pivot?.duration_minutes ?? 30),
            sort_order: b.pivot?.sort_order ?? idx + 1,
        }));

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        description: string;
        school_id: string;
        start_at: string;
        end_at: string;
        shuffle_questions: boolean;
        allow_review: boolean;
        question_banks: FormBank[];
    }>({
        name: exam.name,
        description: exam.description ?? '',
        school_id: String(exam.school_id),
        start_at: exam.start_at,
        end_at: exam.end_at,
        shuffle_questions: exam.settings?.shuffle_questions ?? true,
        allow_review: exam.settings?.allow_review ?? true,
        question_banks: initialBanks,
    });

    const banksSorted = useMemo(() => {
        return [...(data.question_banks ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
        );
    }, [data.question_banks]);

    const selectedIdsSet = useMemo(() => {
        return new Set(banksSorted.map((b) => b.id));
    }, [banksSorted]);

    const availableToAdd = useMemo(() => {
        return questionBanks.filter((qb) => !selectedIdsSet.has(String(qb.id)));
    }, [questionBanks, selectedIdsSet]);

    const totalMinutes = useMemo(() => {
        return banksSorted.reduce((sum, b) => {
            const n = Number(b.duration_minutes);
            return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
    }, [banksSorted]);

    const bankNameById = (id: string) => {
        return questionBanks.find((q) => String(q.id) === id)?.name ?? '—';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const normalized = banksSorted.map((b, idx) => ({
            ...b,
            sort_order: idx + 1,
        }));

        setData('question_banks', normalized);

        put(`/admin/exams/${exam.id}`, {
            preserveScroll: true,
        });
    };

    const addBank = () => {
        if (availableToAdd.length === 0) return;

        const next = availableToAdd[0];
        const nextOrder = banksSorted.length + 1;

        setData('question_banks', [
            ...banksSorted,
            {
                id: String(next.id),
                duration_minutes: '30',
                sort_order: nextOrder,
            },
        ]);
    };

    const removeBank = (id: string) => {
        const next = banksSorted.filter((b) => b.id !== id);
        const reindexed = next.map((b, idx) => ({
            ...b,
            sort_order: idx + 1,
        }));
        setData('question_banks', reindexed);
    };

    const updateBank = (id: string, patch: Partial<FormBank>) => {
        const next = banksSorted.map((b) =>
            b.id === id ? { ...b, ...patch } : b,
        );
        setData('question_banks', next);
    };

    const moveBank = (id: string, dir: 'up' | 'down') => {
        const idx = banksSorted.findIndex((b) => b.id === id);
        if (idx === -1) return;
        const swapWith = dir === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= banksSorted.length) return;

        const next = [...banksSorted];
        const tmp = next[idx];
        next[idx] = next[swapWith];
        next[swapWith] = tmp;

        const reindexed = next.map((b, i) => ({ ...b, sort_order: i + 1 }));
        setData('question_banks', reindexed);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin Dashboard', href: '/admin/dashboard' },
                { title: 'Daftar Ujian', href: '/admin/exams' },
                { title: 'Edit Ujian', href: `/admin/exams/${exam.id}/edit` },
            ]}
        >
            <Head title="Edit Ujian" />

            <div className="p-4">
                <Card className="mx-auto max-w-screen">
                    <CardHeader>
                        <CardTitle>Edit Ujian</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nama */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ujian *</Label>
                                <Input
                                    id="name"
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
                                <Select
                                    value={data.school_id}
                                    onValueChange={(v) =>
                                        setData('school_id', v)
                                    }
                                >
                                    <SelectTrigger
                                        id="school_id"
                                        className={cn(
                                            errors.school_id &&
                                                'border-red-500',
                                        )}
                                    >
                                        <SelectValue placeholder="Pilih sekolah" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.school_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.school_id}
                                    </p>
                                )}
                            </div>

                            {/* Start / End */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_at">
                                        Dimulai di *
                                    </Label>
                                    <Input
                                        id="start_at"
                                        type="datetime-local"
                                        value={toDateTimeLocal(data.start_at)}
                                        onChange={(e) =>
                                            setData(
                                                'start_at',
                                                fromDateTimeLocal(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={cn(
                                            errors.start_at && 'border-red-500',
                                        )}
                                    />
                                    {errors.start_at && (
                                        <p className="text-sm text-red-500">
                                            {errors.start_at}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_at">
                                        Berakhir di *
                                    </Label>
                                    <Input
                                        id="end_at"
                                        type="datetime-local"
                                        value={toDateTimeLocal(data.end_at)}
                                        onChange={(e) =>
                                            setData(
                                                'end_at',
                                                fromDateTimeLocal(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={cn(
                                            errors.end_at && 'border-red-500',
                                        )}
                                    />
                                    {errors.end_at && (
                                        <p className="text-sm text-red-500">
                                            {errors.end_at}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Bank soal (multi) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Bank Soal *</Label>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addBank}
                                        disabled={availableToAdd.length === 0}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah
                                    </Button>
                                </div>

                                {/* field-level error from laravel validation */}
                                {errors.question_banks && (
                                    <p className="text-sm text-red-500">
                                        {
                                            errors.question_banks as unknown as string
                                        }
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {banksSorted.length === 0 ? (
                                        <div className="rounded-md border p-3 text-sm text-muted-foreground">
                                            Belum ada bank soal dipilih.
                                        </div>
                                    ) : (
                                        banksSorted.map((b, idx) => (
                                            <div
                                                key={`${b.id}-${idx}`}
                                                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            #{idx + 1}
                                                        </Badge>
                                                        <span className="font-medium">
                                                            {bankNameById(b.id)}
                                                        </span>
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {/* pilih bank */}
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">
                                                                Bank Soal
                                                            </p>
                                                            <Select
                                                                value={b.id}
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    updateBank(
                                                                        b.id,
                                                                        {
                                                                            id: val,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {questionBanks.map(
                                                                        (
                                                                            qb,
                                                                        ) => {
                                                                            const qbId =
                                                                                String(
                                                                                    qb.id,
                                                                                );
                                                                            const usedByOther =
                                                                                selectedIdsSet.has(
                                                                                    qbId,
                                                                                ) &&
                                                                                qbId !==
                                                                                    b.id;

                                                                            return (
                                                                                <SelectItem
                                                                                    key={
                                                                                        qb.id
                                                                                    }
                                                                                    value={
                                                                                        qbId
                                                                                    }
                                                                                    disabled={
                                                                                        usedByOther
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        qb.name
                                                                                    }
                                                                                </SelectItem>
                                                                            );
                                                                        },
                                                                    )}
                                                                </SelectContent>
                                                            </Select>

                                                            {/* per-item validation error (optional) */}
                                                            {(
                                                                errors as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                                `question_banks.${idx}.id`
                                                            ] && (
                                                                <p className="text-sm text-red-500">
                                                                    {
                                                                        (
                                                                            errors as Record<
                                                                                string,
                                                                                string
                                                                            >
                                                                        )[
                                                                            `question_banks.${idx}.id`
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* durasi */}
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">
                                                                Durasi (menit)
                                                            </p>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={300}
                                                                value={
                                                                    b.duration_minutes
                                                                }
                                                                onChange={(e) =>
                                                                    updateBank(
                                                                        b.id,
                                                                        {
                                                                            duration_minutes:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                            />

                                                            {(
                                                                errors as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                                `question_banks.${idx}.duration_minutes`
                                                            ] && (
                                                                <p className="text-sm text-red-500">
                                                                    {
                                                                        (
                                                                            errors as Record<
                                                                                string,
                                                                                string
                                                                            >
                                                                        )[
                                                                            `question_banks.${idx}.duration_minutes`
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* actions */}
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            moveBank(b.id, 'up')
                                                        }
                                                        disabled={idx === 0}
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            moveBank(
                                                                b.id,
                                                                'down',
                                                            )
                                                        }
                                                        disabled={
                                                            idx ===
                                                            banksSorted.length -
                                                                1
                                                        }
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            removeBank(b.id)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
                                    <span className="text-muted-foreground">
                                        Total durasi (otomatis)
                                    </span>
                                    <Badge className="bg-primary text-primary-foreground">
                                        {totalMinutes} menit
                                    </Badge>
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
                                    {processing
                                        ? 'Memperbarui...'
                                        : 'Perbarui Ujian'}
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
