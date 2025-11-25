import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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
import { AlertCircle, Download } from 'lucide-react';

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface School {
    id: number;
    name: string;
}

interface Props {
    schools: School[];
}

interface PreviewRow {
    row: number;
    name: string;
    email: string;
    school_id: number | string | null;
    class: string | null;
}

interface ImportPreviewResponse {
    success: boolean;
    preview: PreviewRow[];
    errors: string[];
    total_rows: number;
    message?: string;
}

const createBreadcrumbs = (): BreadcrumbItem[] => {
    return [
        { title: 'Users Management', href: '/admin/users' },
        { title: 'Create / Import Users', href: '/admin/users/create' },
    ];
};

export default function UserCreate({ schools }: Props) {
    // ---- Single user form ----
    const { data, setData, post, errors, processing } = useForm<{
        name: string;
        email: string;
        password: string;
        role: 'admin' | 'teacher' | 'student';
        school_id: string;
        class: string;
    }>({
        name: '',
        email: '',
        password: '',
        role: 'teacher',
        school_id: '',
        class: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const handleCancel = () => {
        window.location.href = '/admin/users';
    };

    const isStudent = data.role === 'student';

    // ---- Bulk import state (students only) ----
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingImport, setLoadingImport] = useState(false);

    const csrfToken =
        (
            document.head.querySelector(
                'meta[name="csrf-token"]',
            ) as HTMLMetaElement | null
        )?.content ?? '';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;
        setFile(selectedFile);
        setPreview([]);
        setImportErrors([]);
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/admin/users/import/template';
    };

    const handlePreviewImport = async () => {
        if (!file || !csrfToken) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('_token', csrfToken);

        setLoadingPreview(true);
        setImportErrors([]);
        setPreview([]);

        try {
            const response = await fetch('/admin/users/import/preview', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (!response.ok) {
                setImportErrors([
                    'Failed to preview file. Please check the format.',
                ]);
                return;
            }

            const json = (await response.json()) as ImportPreviewResponse;

            if (json.success) {
                setPreview(json.preview ?? []);
                setImportErrors(json.errors ?? []);
            } else {
                setImportErrors([
                    json.message ?? 'Failed to preview file on server.',
                ]);
            }
        } catch {
            setImportErrors([
                'An unexpected error occurred while previewing the file.',
            ]);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleImport = () => {
        if (!file || !csrfToken) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('_token', csrfToken);

        setLoadingImport(true);
        setImportErrors([]);

        router.post('/admin/users/import', formData, {
            forceFormData: true,
            onFinish: () => {
                setLoadingImport(false);
            },
            onSuccess: () => {
                router.visit('/admin/users');
            },
            onError: () => {
                setImportErrors([
                    'Import failed. Please check the file and try again.',
                ]);
            },
        });
    };

    const breadcrumbs = createBreadcrumbs();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create / Import Users" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        User Management – Create & Import
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create a single user (admin/teacher/student) or import
                        multiple students in bulk from a file.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* -------- LEFT: Single User Create -------- */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Single User</CardTitle>
                            <CardDescription>
                                Add one admin, teacher, or student at a time.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Full Name{' '}
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
                                        Email Address{' '}
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
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        placeholder="••••••••"
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
                                        Minimum 8 characters required
                                    </p>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <Label htmlFor="role">
                                        Role{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>

                                    <Select
                                        value={data.role}
                                        onValueChange={(value) =>
                                            setData(
                                                'role',
                                                value as
                                                    | 'admin'
                                                    | 'teacher'
                                                    | 'student',
                                            )
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
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="teacher">
                                                Teacher
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value="student">
                                                Student
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {errors.role && (
                                        <p className="text-sm text-destructive">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                {/* Extra fields for students: school + class */}
                                {isStudent && (
                                    <>
                                        {/* School */}
                                        <div className="space-y-2">
                                            <Label htmlFor="school_id">
                                                School (optional)
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
                                                    <SelectValue placeholder="Select a school" />
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

                                        {/* Class */}
                                        <div className="space-y-2">
                                            <Label htmlFor="class">
                                                Class (optional)
                                            </Label>
                                            <Input
                                                id="class"
                                                value={data.class}
                                                onChange={(e) =>
                                                    setData(
                                                        'class',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="10A, 8B, etc."
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
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1"
                                    >
                                        {processing
                                            ? 'Creating...'
                                            : 'Create User'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* -------- RIGHT: Bulk Import Students -------- */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Students (Bulk)</CardTitle>
                            <CardDescription>
                                Upload a CSV / Excel file to create many student
                                accounts at once.
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
                                    Use the template format for a smoother
                                    import.
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label>Upload File</Label>
                                <Input
                                    type="file"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={handlePreviewImport}
                                    disabled={!file || loadingPreview}
                                    className="flex-1"
                                >
                                    {loadingPreview
                                        ? 'Previewing...'
                                        : 'Preview'}
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

                            {importErrors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <ul className="mt-2 list-disc pl-4 text-sm">
                                            {importErrors.map(
                                                (err, idx: number) => (
                                                    <li key={idx}>{err}</li>
                                                ),
                                            )}
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
                                                            {row.school_id ??
                                                                '-'}
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

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    During import, existing emails will be
                                    skipped. Import is intended for{' '}
                                    <span className="font-semibold">
                                        students only
                                    </span>
                                    .
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
