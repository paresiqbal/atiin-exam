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
import type React from 'react';
import { type FormEvent, useState } from 'react';

interface PreviewRow {
    row: number;
    type: string;
    name: string;
    description: string | null;
    university_name: string | null;
    minimum_passing_grade: number | null;
}

interface ImportResponse {
    success: boolean;
    preview?: PreviewRow[];
    errors?: string[];
    total_rows?: number;
    message?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Daftar Universitas',
        href: '/admin/universities',
    },
    { title: 'Import CSV', href: '/admin/universities/import' },
];

export default function UniversityImport() {
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

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (
                [
                    'text/csv',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ].includes(droppedFile.type) ||
                droppedFile.name.endsWith('.csv') ||
                droppedFile.name.endsWith('.xlsx') ||
                droppedFile.name.endsWith('.xls')
            ) {
                setFile(droppedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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
                },
            });

            const data: ImportResponse = await response.json();

            if (data.success) {
                setPreview(data.preview || []);
                setErrors(data.errors || []);
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Failed to preview file',
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error uploading file' });
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
                },
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Import completed successfully!',
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
                    text: 'Import failed. Please try again.',
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error during import' });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = '/admin/universities/import/template';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Universities & Majors" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Bulk Import Universitas & Program Studi
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Upload file CSV untuk mengimpor multiple universitas dan
                        program studi sekaligus
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
                                Mulai dengan template terformat kami
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                className="gap-2 bg-transparent"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Template CSV
                            </Button>
                        </CardContent>
                    </Card>

                    {/* File Upload Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Upload File
                            </CardTitle>
                            <CardDescription>
                                Format yang diterima: CSV, XLS, XLSX (Maks 2MB)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                        accept=".csv,.xlsx,.xls"
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
                                                : 'Drag and drop file anda di sini, atau klik untuk memilih'}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Format CSV, XLS, atau XLSX
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
                        </CardContent>
                    </Card>

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
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {/* Errors */}
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

                    {/* Preview Table */}
                    {preview.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Preview ({preview.length} rows)
                                </CardTitle>
                                <CardDescription>
                                    Review data sebelum mengimpor
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-2 text-left font-semibold">
                                                    Row
                                                </th>
                                                <th className="p-2 text-left font-semibold">
                                                    Type
                                                </th>
                                                <th className="p-2 text-left font-semibold">
                                                    Name
                                                </th>
                                                <th className="p-2 text-left font-semibold">
                                                    Description
                                                </th>
                                                <th className="p-2 text-left font-semibold">
                                                    University
                                                </th>
                                                <th className="p-2 text-left font-semibold">
                                                    Min Grade
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
                                                        <td className="p-2 text-xs text-muted-foreground">
                                                            {row.description
                                                                ? row.description.substring(
                                                                      0,
                                                                      30,
                                                                  ) + '...'
                                                                : '-'}
                                                        </td>
                                                        <td className="p-2 text-xs">
                                                            {row.university_name ||
                                                                '-'}
                                                        </td>
                                                        <td className="p-2 text-xs">
                                                            {row.minimum_passing_grade ||
                                                                '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {preview.length > 10 && (
                                    <p className="text-sm text-muted-foreground">
                                        Showing 10 of {preview.length} rows
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
                            </CardContent>
                        </Card>
                    )}

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
