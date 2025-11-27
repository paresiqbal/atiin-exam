import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

import type { BreadcrumbItem } from '@/types';
import type { User } from '@/types/user';

type UserRole = 'admin' | 'instructor' | 'student';

interface UserEditFormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

interface UserEditProps {
    user: User;
}

const baseUrl = '/admin/users';

const createBreadcrumbs = (userId: number): BreadcrumbItem[] => [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Manajemen Pengguna',
        href: baseUrl,
    },
    {
        title: 'Edit Pengguna',
        href: `${baseUrl}/${userId}/edit`,
    },
];

export default function UserEdit({ user }: UserEditProps) {
    const { data, setData, put, errors, processing } =
        useForm<UserEditFormData>({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role as UserRole,
        });

    const [isDeleting, setIsDeleting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`${baseUrl}/${user.id}`);
    };

    const handleDelete = () => {
        setIsDeleting(true);

        router.delete(`${baseUrl}/${user.id}`, {
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleCancel = () => {
        window.location.href = baseUrl;
    };

    const breadcrumbs = createBreadcrumbs(user.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Page header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        Edit Pengguna
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Perbarui informasi pengguna. Kolom yang ditandai dengan{' '}
                        <span className="text-destructive">*</span> wajib diisi.
                    </p>
                </div>

                {/* Main card */}
                <Card className="max-w-auto w-full">
                    <CardHeader>
                        <CardTitle>Informasi Pengguna</CardTitle>
                        <CardDescription>
                            Perbarui detail pengguna di bawah ini.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Lengkap{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Alamat Email{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    className={
                                        errors.email ? 'border-destructive' : ''
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
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
                                    Minimum 8 karakter diperlukan jika diisi.
                                    Biarkan kosong untuk mempertahankan kata
                                    sandi saat ini.
                                </p>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Peran{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(value) =>
                                        setData('role', value as UserRole)
                                    }
                                >
                                    <SelectTrigger
                                        id="role"
                                        className={
                                            errors.role
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Pilih peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">
                                            Siswa
                                        </SelectItem>
                                        <SelectItem value="instructor">
                                            Guru
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-destructive">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-4 md:flex-row">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Memperbarui...'
                                        : 'Perbarui Pengguna'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>

                                {/* Delete with dialog */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            className="flex-1"
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {isDeleting
                                                ? 'Menghapus...'
                                                : 'Hapus'}
                                        </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Hapus pengguna ini?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Anda akan menghapus pengguna{' '}
                                                <span className="font-semibold">
                                                    {user.name}
                                                </span>
                                                . Tindakan ini tidak dapat
                                                dibatalkan dan dapat
                                                mempengaruhi data terkait.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                disabled={isDeleting}
                                            >
                                                Batal
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                {isDeleting
                                                    ? 'Menghapus...'
                                                    : 'Ya, hapus'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info alert */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Hapus pengguna dengan hati-hati. Pastikan untuk meninjau
                        dampak potensial pada data terkait sebelum melanjutkan.
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
