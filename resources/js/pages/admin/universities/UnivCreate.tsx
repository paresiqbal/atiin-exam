import { MajorForm } from '@/components/MajorForm';
import { UniversityForm } from '@/components/UniversityForm';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    Loader2,
    Upload,
} from 'lucide-react';

import React, { useState, type FormEvent } from 'react';

interface PreviewRow {
    row: number;
    type: string;
    name: string;
    code: string | null;
    city: string | null;
    description: string | null;
    university_name: string | null;
    minimum_passing_grade: string | number | null;
}

interface ImportResponse {
    success: boolean;
    preview?: PreviewRow[];
    errors?: string[];
    total_rows?: number;
    message?: string;
    created_universities?: number;
    created_majors?: number;
    failed?: number;
}

type UniversityOption = {
    id: number;
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Daftar Universitas',
        href: '/admin/universities',
    },
    { title: 'Buat Universitas', href: '/admin/universities/create' },
];

// Get CSRF token from meta tag
const csrfToken = (
    document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
)?.content;

export default function UnivCreate({
    universities,
}: {
    universities: UniversityOption[];
}) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];

            if (
                droppedFile.type === 'text/csv' ||
                droppedFile.name.toLowerCase().endsWith('.csv')
            ) {
                setFile(droppedFile);
            } else {
                setMessage({
                    type: 'error',
                    text: 'Hanya file CSV yang diperbolehkan.',
                });
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const pickedFile = e.target.files[0];

            if (
                pickedFile.type === 'text/csv' ||
                pickedFile.name.toLowerCase().endsWith('.csv')
            ) {
                setFile(pickedFile);
            } else {
                setMessage({
                    type: 'error',
                    text: 'Hanya file CSV yang diperbolehkan.',
                });
            }
        }
    };

    const handlePreview = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setErrors([]);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/admin/universities/import/preview', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data: ImportResponse = await response.json();

            if (response.ok && data.success) {
                setPreview(data.preview || []);
                setErrors(data.errors || []);
            } else {
                setPreview([]);
                setErrors(data.errors || []);
                setMessage({
                    type: 'error',
                    text:
                        data.message ||
                        'Gagal melakukan preview file. Periksa format CSV Anda.',
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan saat mengunggah file.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || preview.length === 0) return;

        setImporting(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/admin/universities/import', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data: ImportResponse = await response.json();

            if (response.ok && data.success) {
                setMessage({
                    type: 'success',
                    text:
                        data.message ||
                        'Import selesai! Data universitas dan program studi berhasil diimpor.',
                });
                setFile(null);
                setPreview([]);
                setErrors([]);

                setTimeout(() => {
                    window.location.href = '/admin/universities';
                }, 1500);
            } else {
                setMessage({
                    type: 'error',
                    text:
                        data.message ||
                        'Import gagal. Silakan cek kembali file Anda.',
                });
                setErrors(data.errors || []);
            }
        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan saat proses import.',
            });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = '/admin/universities/import/template';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Universitas dan Jurusan Baru" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Buat Universitas dan Jurusan Baru
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Upload file CSV untuk mengimpor multiple universitas dan
                        program studi sekaligus.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Template Download Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Unduh Template
                            </CardTitle>
                            <CardDescription>
                                Mulai dengan template CSV yang sudah diformat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                className="gap-2 bg-transparent"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Template CSV
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Kolom: <strong>type</strong> (university|major),{' '}
                                <strong>name</strong>, <strong>code</strong>,{' '}
                                <strong>city</strong>,{' '}
                                <strong>description</strong>,{' '}
                                <strong>university_name</strong> (untuk major),
                                <strong> minimum_passing_grade</strong> (0-100).
                            </p>
                        </CardContent>
                    </Card>

                    {/* File Upload + Preview + Import in ONE card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Upload & Preview
                            </CardTitle>
                            <CardDescription>
                                Upload file CSV, lakukan preview, lalu import ke
                                sistem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form
                                onSubmit={handlePreview}
                                className="space-y-4"
                            >
                                <div
                                    className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                                        dragActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="file-input"
                                        className="hidden"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                    />
                                    <label
                                        htmlFor="file-input"
                                        className="cursor-pointer"
                                    >
                                        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                        <p className="font-semibold text-foreground">
                                            {file
                                                ? file.name
                                                : 'Drag and drop file CSV Anda di sini, atau klik untuk memilih'}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Hanya file CSV dengan ukuran
                                            maksimal 2MB.
                                        </p>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="w-full gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Preview...
                                        </>
                                    ) : (
                                        'Preview File'
                                    )}
                                </Button>
                            </form>

                            {/* Message Display */}
                            {message && (
                                <Alert
                                    variant={
                                        message.type === 'error'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                >
                                    {message.type === 'error' ? (
                                        <AlertCircle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    <AlertDescription>
                                        {message.text}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="mb-2 font-semibold">
                                            Validation Errors:
                                        </div>
                                        <ul className="space-y-1 text-sm">
                                            {errors.map((error, idx) => (
                                                <li
                                                    key={idx}
                                                    className="ml-4 list-disc"
                                                >
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Preview Table + Import button */}
                            {preview.length > 0 && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-2 text-left font-semibold">
                                                        Baris
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Tipe
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Nama
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Kode
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Kota
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Deskripsi
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Universitas
                                                    </th>
                                                    <th className="p-2 text-left font-semibold">
                                                        Passing Grade
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview
                                                    .slice(0, 10)
                                                    .map((row, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className={
                                                                idx % 2 === 0
                                                                    ? 'bg-muted/30'
                                                                    : ''
                                                            }
                                                        >
                                                            <td className="p-2">
                                                                {row.row}
                                                            </td>
                                                            <td className="p-2">
                                                                <span
                                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                                        row.type ===
                                                                        'university'
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                    }`}
                                                                >
                                                                    {row.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">
                                                                {row.name}
                                                            </td>
                                                            <td className="p-2 text-xs">
                                                                {row.code ||
                                                                    '-'}
                                                            </td>
                                                            <td className="p-2 text-xs">
                                                                {row.city ||
                                                                    '-'}
                                                            </td>
                                                            <td className="p-2 text-xs text-muted-foreground">
                                                                {row.description
                                                                    ? row.description
                                                                          .toString()
                                                                          .slice(
                                                                              0,
                                                                              40,
                                                                          ) +
                                                                      '...'
                                                                    : '-'}
                                                            </td>
                                                            <td className="p-2 text-xs">
                                                                {row.university_name ||
                                                                    '-'}
                                                            </td>
                                                            <td className="p-2 text-xs">
                                                                {row.minimum_passing_grade ??
                                                                    '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {preview.length > 10 && (
                                        <p className="text-sm text-muted-foreground">
                                            Menampilkan 10 dari {preview.length}{' '}
                                            baris.
                                        </p>
                                    )}

                                    <form
                                        onSubmit={handleImport}
                                        className="space-y-4"
                                    >
                                        <Button
                                            type="submit"
                                            disabled={importing}
                                            className="w-full gap-2"
                                        >
                                            {importing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Mengimpor...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4" />
                                                    Import {preview.length} Rows
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Manual create forms */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <UniversityForm onCreated={() => {}} />
                        <MajorForm
                            universities={universities ?? []}
                            onCreated={() => {}}
                        />
                    </div>

                    {/* Back Link */}
                    <Link href="/admin/universities" method="get">
                        <Button
                            variant="outline"
                            className="w-full bg-transparent"
                        >
                            Kembali ke Daftar Universitas
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
