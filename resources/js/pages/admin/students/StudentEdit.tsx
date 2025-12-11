import { Head, useForm } from '@inertiajs/react';
import type React from 'react';

import AppLayout from '@/layouts/app-layout';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import type { BreadcrumbItem } from '@/types';
import type { School } from '@/types/user-import';

interface Student {
    id: number;
    name: string;
    email: string;
    school_id: number | null;
    class?: string | null;
}

interface StudentEditProps {
    student: Student;
    schools: School[];
}

interface StudentEditFormData {
    name: string;
    email: string;
    password: string;
    school_id: string;
    class: string;
}

export default function StudentEdit({ student, schools }: StudentEditProps) {
    const { data, setData, put, errors, processing } =
        useForm<StudentEditFormData>({
            name: student.name ?? '',
            email: student.email ?? '',
            password: '',
            school_id: student.school_id ? String(student.school_id) : '',
            class: student.class ?? '',
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/students/${student.id}`);
    };

    const handleCancel = () => {
        window.location.href = '/admin/students';
    };

    const baseUrl = '/admin/students';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Manajemen Siswa',
            href: '/admin/students',
        },
        {
            title: `Edit Siswa`,
            href: `/admin/students/${student.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Siswa - ${student.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        Manajemen Siswa – Edit
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui data siswa seperti nama, email, sekolah, dan
                        kelas.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card className="order-2 lg:order-1">
                        <CardHeader>
                            <CardTitle>Edit Data Siswa</CardTitle>
                            <CardDescription>
                                Sesuaikan informasi siswa sesuai kebutuhan.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Lengkap{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className={
                                            errors.name
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Alamat Email{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        className={
                                            errors.email
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Password Baru (opsional)
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="Kosongkan jika tidak ingin mengubah"
                                        className={
                                            errors.password
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive">
                                            {errors.password}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Isi hanya jika Anda ingin mengubah
                                        password siswa ini.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="school_id">
                                        Sekolah (opsional)
                                    </Label>
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
                                                    ? 'border-destructive'
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
                                        <p className="text-sm text-destructive">
                                            {errors.school_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="class">
                                        Kelas (opsional)
                                    </Label>
                                    <Input
                                        id="class"
                                        value={data.class}
                                        onChange={(e) =>
                                            setData('class', e.target.value)
                                        }
                                        placeholder="10A, 8B, dll."
                                        className={
                                            errors.class
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    />
                                    {errors.class && (
                                        <p className="text-sm text-destructive">
                                            {errors.class}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan Perubahan'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="flex-1"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="order-1 lg:order-2">
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                            <CardDescription>
                                Beberapa hal yang perlu diperhatikan saat
                                mengubah data siswa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <p className="mt-2">
                                    Perubahan email akan mempengaruhi cara siswa
                                    login. Pastikan email yang digunakan valid
                                    dan aktif.
                                </p>
                            </Alert>

                            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                <li>
                                    Password hanya akan diubah jika Anda mengisi
                                    kolom password baru.
                                </li>
                                <li>
                                    Kelas dan sekolah bersifat opsional, namun
                                    membantu dalam pengelompokan siswa.
                                </li>
                                <li>
                                    Anda dapat menghapus siswa dari halaman
                                    daftar siswa jika sudah tidak aktif.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
                <Alert className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <AlertDescription>
                            Hapus siswa dengan hati-hati. Data terkait seperti
                            hasil ujian mungkin ikut terpengaruh. Pastikan Anda
                            sudah meninjau konsekuensinya sebelum melanjutkan.
                        </AlertDescription>
                    </div>

                    <ConfirmDeleteButton
                        deleteUrl={`${baseUrl}/${student.id}`}
                        resourceLabel="siswa"
                        itemName={student.name}
                    />
                </Alert>
            </div>
        </AppLayout>
    );
}
