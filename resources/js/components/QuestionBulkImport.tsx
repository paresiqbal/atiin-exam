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
    Download,
    Loader2,
    Upload,
} from 'lucide-react';
import type React from 'react';
import { type FormEvent, useMemo, useState } from 'react';

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

// helper: CSRF
function getCsrfToken(): string {
    const meta = document.querySelector(
        "meta[name='csrf-token']",
    ) as HTMLMetaElement | null;
    return meta?.content ?? '';
}

// helper: detect route prefix from current URL
function getRoutePrefix(): 'admin' | 'teacher' {
    if (typeof window === 'undefined') return 'admin';
    const firstSeg = window.location.pathname.split('/').filter(Boolean)[0];
    return firstSeg === 'teacher' ? 'teacher' : 'admin';
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

    // Build URLs once (based on current page prefix)
    const { previewUrl, importUrl, templateUrl } = useMemo(() => {
        const prefix = getRoutePrefix();
        return {
            previewUrl: `/${prefix}/question-banks/${questionBankId}/questions/import/preview`,
            importUrl: `/${prefix}/question-banks/${questionBankId}/questions/import`,
            templateUrl: `/${prefix}/question-banks/${questionBankId}/questions/import/template`,
        };
    }, [questionBankId]);

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
        setPreview([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(previewUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                // If you ever run this from a different origin (vite :5173), change to 'include'
                credentials: 'same-origin',
            });

            // If blocked by middleware, Laravel may return HTML, not JSON.
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(
                    `Unexpected response (non-JSON). Status: ${response.status}`,
                );
            }

            const data: ImportResponse = await response.json();

            if (data.success) {
                setPreview(data.preview || []);
                setErrors(data.errors || []);
                setMessage(null);
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Gagal melakukan preview file',
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan saat mengupload file',
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
            const response = await fetch(importUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                // If you ever run this from a different origin (vite :5173), change to 'include'
                credentials: 'same-origin',
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Import soal berhasil!',
                });
                setFile(null);
                setPreview([]);
                setErrors([]);

                setTimeout(() => {
                    onImportSuccess?.();
                    window.location.reload();
                }, 1000);
            } else {
                setMessage({
                    type: 'error',
                    text: 'Import gagal. Silakan coba lagi.',
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan saat proses import',
            });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = templateUrl;
    };

    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-base">
                        Bulk Import Soal
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Upload file CSV / Excel untuk membuat banyak soal
                        sekaligus.
                    </CardDescription>
                </div>
                <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Template CSV
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Info format */}
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <div className="font-semibold text-foreground">
                        Format Kolom:
                    </div>
                    <div className="mt-1">
                        <span className="font-mono">
                            Pertanyaan | Tipe | Poin | URL Gambar | Opsi
                        </span>
                        <br />
                        Gunakan <span className="font-mono">|</span> sebagai
                        pemisah opsi, dan awali opsi benar dengan{' '}
                        <span className="font-mono">*</span>.
                        <br />
                        Contoh:{' '}
                        <span className="font-mono">
                            *4|3|5|6 (4 adalah jawaban benar)
                        </span>
                    </div>
                </div>

                {/* Upload + Preview */}
                <form onSubmit={handlePreview} className="space-y-3">
                    <div
                        className={`rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
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
                            <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                            <p className="font-medium text-foreground">
                                {file
                                    ? file.name
                                    : 'Drag & drop file di sini, atau klik untuk memilih'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Format: CSV, XLS, XLSX — Maksimal 2MB
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
                                Preview File...
                            </>
                        ) : (
                            'Preview File'
                        )}
                    </Button>
                </form>

                {/* Message */}
                {message && (
                    <Alert
                        variant={
                            message.type === 'error' ? 'destructive' : 'default'
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

                {/* Validation Errors */}
                {errors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="mb-1 text-sm font-semibold">
                                Error pada data:
                            </div>
                            <ul className="space-y-1 text-xs">
                                {errors.map((error, idx) => (
                                    <li key={idx} className="ml-4 list-disc">
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Preview {preview.length} soal pertama dari file
                            </span>
                            {errors.length > 0 && (
                                <span>{errors.length} baris bermasalah</span>
                            )}
                        </div>

                        <div className="max-h-80 space-y-2 overflow-y-auto">
                            {preview.slice(0, 10).map((question, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-md border bg-card p-3 text-xs"
                                >
                                    <div className="mb-1 flex items-start justify-between">
                                        <span className="font-semibold text-foreground">
                                            Row {question.row}
                                        </span>
                                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                                            {question.points} poin
                                        </span>
                                    </div>
                                    <p className="mb-2 line-clamp-2 text-muted-foreground">
                                        {question.question_text}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {question.options.map((opt, optIdx) => (
                                            <span
                                                key={optIdx}
                                                className={`rounded px-2 py-0.5 text-[10px] ${
                                                    opt.is_correct
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                                }`}
                                            >
                                                {opt.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {preview.length > 10 && (
                            <p className="text-[10px] text-muted-foreground">
                                Menampilkan 10 dari {preview.length} soal.
                            </p>
                        )}

                        <form onSubmit={handleImport}>
                            <Button
                                type="submit"
                                disabled={importing}
                                className="mt-1 w-full gap-2"
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
        </Card>
    );
}
