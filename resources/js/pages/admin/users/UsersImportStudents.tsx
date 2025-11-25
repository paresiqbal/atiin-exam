// resources/js/pages/admin/users/UsersImportStudents.tsx

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
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, Download } from 'lucide-react';
import { useState } from 'react';

interface PreviewRow {
    row: number;
    name: string;
    email: string;
    school_id: string | number | null;
    class: string | null;
}

export default function UsersImportStudents() {
    const breadcrumbs = [
        { title: 'Users Management', href: '/admin/users' },
        { title: 'Import Students', href: '/admin/users/import' },
    ];

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingImport, setLoadingImport] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        setPreview([]);
        setErrors([]);
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/admin/users/import/template';
    };

    const handlePreview = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoadingPreview(true);
        setErrors([]);
        setPreview([]);

        try {
            const res = await axios.post(
                '/admin/users/import/preview',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );

            if (res.data.success) {
                setPreview(res.data.preview || []);
                setErrors(res.data.errors || []);
            } else {
                setErrors([res.data.message || 'Failed to preview file']);
            }
        } catch (error: any) {
            setErrors([
                error.response?.data?.message ||
                    'Failed to preview file. Please check the format.',
            ]);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoadingImport(true);

        try {
            await axios.post('/admin/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            router.visit('/admin/users');
        } catch (error: any) {
            setErrors([
                error.response?.data?.message ||
                    'Import failed. Please check the file and try again.',
            ]);
        } finally {
            setLoadingImport(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Students" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Import Students</h1>
                    <p className="text-sm text-muted-foreground">
                        Upload a CSV or Excel file to create multiple student
                        accounts at once.
                    </p>
                </div>

                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle>Upload File</CardTitle>
                        <CardDescription>
                            Supported formats: .csv, .xlsx, .xls. Maximum size:
                            2MB.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Use the template to avoid formatting issues.
                            </span>
                        </div>

                        <div className="space-y-2">
                            <Input
                                type="file"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={handlePreview}
                                disabled={!file || loadingPreview}
                                className="flex-1"
                            >
                                {loadingPreview ? 'Previewing...' : 'Preview'}
                            </Button>

                            <Button
                                type="button"
                                onClick={handleImport}
                                disabled={!file || loadingImport}
                                className="flex-1"
                            >
                                {loadingImport ? 'Importing...' : 'Import'}
                            </Button>
                        </div>

                        {errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <ul className="mt-2 list-disc pl-4 text-sm">
                                        {errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {preview.length > 0 && (
                            <div className="mt-4">
                                <h2 className="mb-2 text-lg font-semibold">
                                    Preview ({preview.length} rows)
                                </h2>
                                <div className="max-h-64 overflow-auto rounded border">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Row
                                                </th>
                                                <th className="px-3 py-2">
                                                    Name
                                                </th>
                                                <th className="px-3 py-2">
                                                    Email
                                                </th>
                                                <th className="px-3 py-2">
                                                    School ID
                                                </th>
                                                <th className="px-3 py-2">
                                                    Class
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row) => (
                                                <tr
                                                    key={row.row}
                                                    className="border-t"
                                                >
                                                    <td className="px-3 py-2">
                                                        {row.row}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.email}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.school_id ?? '-'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {row.class ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Make sure all students have unique emails. Existing
                        emails will be skipped during import.
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
