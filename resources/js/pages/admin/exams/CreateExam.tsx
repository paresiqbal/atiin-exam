// react
import { Head, useForm } from '@inertiajs/react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
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

// types
import { BreadcrumbItem } from '@/types';

interface QuestionBank {
    id: number;
    name: string;
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

export default function CreateExam({ questionBanks, schools }: Props) {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/exams');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Ujian', href: '/admin/exams' },
        { title: 'Buat Ujian', href: '/admin/exams/create' },
    ];

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
                                    className={
                                        errors.name ? 'border-red-500' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Masukkan deskripsi ujian"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className={
                                        errors.description
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="school_id">Sekolah *</Label>
                                <Select
                                    value={data.school_id}
                                    onValueChange={(value) =>
                                        setData('school_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="school_id"
                                        className={
                                            errors.school_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Pilih sekolah" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((school) => (
                                            <SelectItem
                                                key={school.id}
                                                value={school.id.toString()}
                                            >
                                                {school.name}
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

                            <div className="space-y-2">
                                <Label htmlFor="class">Kelas *</Label>
                                <Input
                                    id="class"
                                    type="text"
                                    placeholder="Contoh: 10 IPA 1"
                                    value={data.class}
                                    onChange={(e) =>
                                        setData('class', e.target.value)
                                    }
                                    className={
                                        errors.class ? 'border-red-500' : ''
                                    }
                                />
                                {errors.class && (
                                    <p className="text-sm text-red-500">
                                        {errors.class}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="question_bank_id">
                                    Bank Soal *
                                </Label>
                                <Select
                                    value={data.question_bank_id}
                                    onValueChange={(value) =>
                                        setData('question_bank_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="question_bank_id"
                                        className={
                                            errors.question_bank_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Pilih bank soal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questionBanks.map((qb) => (
                                            <SelectItem
                                                key={qb.id}
                                                value={qb.id.toString()}
                                            >
                                                {qb.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.question_bank_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.question_bank_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_at">
                                        Dimulai di *
                                    </Label>
                                    <Input
                                        id="start_at"
                                        type="datetime-local"
                                        value={data.start_at}
                                        onChange={(e) =>
                                            setData('start_at', e.target.value)
                                        }
                                        className={
                                            errors.start_at
                                                ? 'border-red-500'
                                                : ''
                                        }
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
                                        value={data.end_at}
                                        onChange={(e) =>
                                            setData('end_at', e.target.value)
                                        }
                                        min={data.start_at || undefined}
                                        className={
                                            errors.end_at
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.end_at && (
                                        <p className="text-sm text-red-500">
                                            {errors.end_at}
                                        </p>
                                    )}
                                </div>
                            </div>

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
                                    className={
                                        errors.time_limit_minutes
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.time_limit_minutes && (
                                    <p className="text-sm text-red-500">
                                        {errors.time_limit_minutes}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Label htmlFor="shuffle_questions">
                                        Acak Soal
                                    </Label>
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
                                </div>

                                <div className="flex items-center space-x-4">
                                    <Label htmlFor="allow_review">
                                        Izinkan Review
                                    </Label>
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
                                </div>
                            </div>

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
