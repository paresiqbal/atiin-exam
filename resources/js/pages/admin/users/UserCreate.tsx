import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Alert } from '@/components/ui/alert';
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
import { AlertCircle, Eye, EyeClosed } from 'lucide-react';

import type { BreadcrumbItem } from '@/types';
import type { UserCreateFormData, UserRole } from '@/types/user-import';

export default function UserCreate() {
    const { data, setData, post, errors, processing } =
        useForm<UserCreateFormData>({
            name: '',
            email: '',
            password: '',
            role: 'teacher',
            school_id: '',
            class: '',
        });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const handleCancel = () => {
        window.location.href = '/admin/users';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: '/admin/dashboard',
        },
        {
            title: 'Manajemen Pengguna',
            href: '/admin/users',
        },
        {
            title: 'Buat Pengguna',
            href: '/admin/users/create',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Buat Pengguna</h1>
                    <p className="text-sm text-muted-foreground">
                        Untuk membuat akun siswa silahkan buat di halaman siswa.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card className="order-2 lg:order-1">
                        <CardHeader>
                            <CardTitle>Buat Pengguna</CardTitle>
                            <CardDescription>
                                Tambahkan satu admin, guru, atau siswa
                                sekaligus.
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
                                        placeholder="John Doe"
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

                                {/* Email */}
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
                                        placeholder="john@example.com"
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

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Password{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••••"
                                            className={`pr-10 ${
                                                errors.password
                                                    ? 'border-destructive'
                                                    : ''
                                            }`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((prev) => !prev)
                                            }
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                            aria-label={
                                                showPassword
                                                    ? 'Sembunyikan password'
                                                    : 'Tampilkan password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeClosed className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="text-sm text-destructive">
                                            {errors.password}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Minimum 8 karakter diperlukan.
                                    </p>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <Label htmlFor="role">
                                        Peran{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
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
                                            <SelectItem value="teacher">
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

                                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        {processing
                                            ? 'Membuat...'
                                            : 'Buat Pengguna'}
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
                            <CardTitle>Petunjuk</CardTitle>
                            <CardDescription>
                                Beberapa hal yang perlu diperhatikan saat
                                membuat pengguna baru.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <Alert className="flex items-center justify-center">
                                <AlertCircle className="h-4 w-4" />
                                <p className="mt-2">
                                    Pastikan email unik dan belum digunakan oleh
                                    pengguna lain.
                                </p>
                            </Alert>

                            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                                <li>
                                    Peran{' '}
                                    <span className="font-medium">Admin</span>{' '}
                                    memiliki akses penuh ke panel admin.
                                </li>
                                <li>
                                    Peran{' '}
                                    <span className="font-medium">Guru</span>{' '}
                                    digunakan untuk mengelola ujian dan siswa.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
