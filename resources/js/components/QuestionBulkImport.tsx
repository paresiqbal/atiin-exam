'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    Loader2,
    Upload,
} from 'lucide-react';
import type React from 'react';
import { type FormEvent, useState } from 'react';

interface PreviewQuestion {
    row: number;
    question_text: string;
    question_type: string;
    points: number;
    image_url: string;
    options: Array<{ text: string; is_correct: boolean }>;
}

interface ImportResponse {
    success: boolean;
    preview?: PreviewQuestion[];
    errors?: string[];
    total_rows?: number;
    message?: string;
}

interface QuestionBulkImportProps {
    questionBankId: number;
    onImportSuccess?: () => void;
}

export default function QuestionBulkImport({
    questionBankId,
    onImportSuccess,
}: QuestionBulkImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewQuestion[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [expanded, setExpanded] = useState(false);

    function getCsrfToken(): string {
        const meta = document.querySelector(
            "meta[name='csrf-token']",
        ) as HTMLMetaElement | null;
        return meta?.content ?? '';
    }

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
            const response = await fetch(
                `/teacher/question-banks/${questionBankId}/questions/import/preview`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            const data: ImportResponse = await response.json();

            if (data.success) {
                setPreview(data.preview || []);
                setErrors(data.errors || []);
                setExpanded(true);
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Failed to preview file',
                });
            }
        } catch (error) {
            console.log(error);

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
            const response = await fetch(
                `/teacher/question-banks/${questionBankId}/questions/import`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Import completed successfully!',
                });
                setFile(null);
                setPreview([]);
                setErrors([]);
                setTimeout(() => {
                    onImportSuccess?.();
                    window.location.reload();
                }, 1500);
            } else {
                setMessage({
                    type: 'error',
                    text: 'Import failed. Please try again.',
                });
            }
        } catch (error) {
            console.log(error);

            setMessage({ type: 'error', text: 'Error during import' });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = `/teacher/question-banks/${questionBankId}/questions/import/template`;
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {expanded ? (
                                    <ChevronUp className="h-5 w-5" />
                                ) : (
                                    <ChevronDown className="h-5 w-5" />
                                )}
                                Bulk Import Soal
                            </CardTitle>
                            <CardDescription>
                                Upload CSV untuk mengimpor multiple soal
                                sekaligus
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                {expanded && (
                    <CardContent className="space-y-4 border-t pt-4">
                        {/* Template Download */}
                        <div className="rounded-lg bg-muted p-4">
                            <p className="mb-2 text-sm font-medium">
                                Panduan Format File
                            </p>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Format kolom: Pertanyaan | Tipe | Poin | URL
                                Gambar | Opsi (gunakan | untuk pemisah, * untuk
                                jawaban benar)
                            </p>
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Template CSV
                            </Button>
                        </div>

                        {/* File Upload */}
                        <form onSubmit={handlePreview} className="space-y-3">
                            <div
                                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
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
                                    id="question-file-input"
                                    className="hidden"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="question-file-input"
                                    className="cursor-pointer"
                                >
                                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="font-semibold text-foreground">
                                        {file
                                            ? file.name
                                            : 'Drag and drop file di sini, atau klik untuk memilih'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        CSV, XLS, atau XLSX (Max 2MB)
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
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Preview ({preview.length} soal)
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {errors.length > 0 &&
                                            `${errors.length} error(s)`}
                                    </p>
                                </div>
                                <div className="max-h-96 space-y-2 overflow-y-auto">
                                    {preview
                                        .slice(0, 10)
                                        .map((question, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg border bg-card p-3 text-sm"
                                            >
                                                <div className="mb-1 flex items-start justify-between">
                                                    <span className="font-medium text-foreground">
                                                        Row {question.row}
                                                    </span>
                                                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                                                        {question.points} poin
                                                    </span>
                                                </div>
                                                <p className="mb-2 line-clamp-2 text-muted-foreground">
                                                    {question.question_text}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {question.options.map(
                                                        (opt, optIdx) => (
                                                            <span
                                                                key={optIdx}
                                                                className={`rounded px-2 py-0.5 text-xs ${
                                                                    opt.is_correct
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                                                }`}
                                                            >
                                                                {opt.text}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {preview.length > 10 && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Showing 10 of {preview.length} soal
                                    </p>
                                )}

                                {/* Import Button */}
                                <form onSubmit={handleImport} className="mt-4">
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
                                                Import {preview.length} Soal
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
