import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// rich editor
import RichTextEditor, { BaseKit } from 'reactjs-tiptap-editor';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Code } from 'reactjs-tiptap-editor/code';
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock';
import { History } from 'reactjs-tiptap-editor/history';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Image } from 'reactjs-tiptap-editor/image';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { Link as TipTapLink } from 'reactjs-tiptap-editor/link';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Admin', href: '/admin/dashboard' },
    { title: 'Daftar Berita', href: '/admin/news' },
    { title: 'Buat Berita', href: '/admin/news/create' },
];

// helper: CSRF
function getCsrfToken(): string {
    const meta = document.querySelector(
        'meta[name="csrf-token"]',
    ) as HTMLMetaElement | null;
    return meta?.content ?? '';
}

// simple debounce hook
function useDebouncedCallback<T>(callback: (value: T) => void, delay: number) {
    const timeoutRef = useRef<number | undefined>(undefined);

    return useCallback(
        (value: T) => {
            if (timeoutRef.current !== undefined) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(
                () => callback(value),
                delay,
            );
        },
        [callback, delay],
    );
}

// editor extensions
const extensions = [
    BaseKit.configure({
        placeholder: { showOnlyCurrent: true },
        characterCount: { limit: 50_000 },
    }),
    History,
    Bold,
    Italic,
    TextUnderline,
    Strike,
    BulletList,
    OrderedList,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TipTapLink,
    Blockquote,
    HorizontalRule,
    Code,
    CodeBlock,
    Image.configure({
        upload: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/admin/news/images', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                body: formData,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                console.error(
                    'News editor image upload failed',
                    await response.text(),
                );
                throw new Error('Image upload failed');
            }

            const data: { url: string } = await response.json();
            return data.url;
        },
    }),
];

type FormData = {
    title: string;
    body: string;
    image: File | null;
};

export default function NewsCreate() {
    const { data, setData, post, processing, errors, reset } =
        useForm<FormData>({
            title: '',
            body: '',
            image: null,
        });

    const [editorContent, setEditorContent] = useState<string>('');

    const debouncedSyncBody = useDebouncedCallback<string>((value) => {
        setData('body', value);
    }, 300);

    useEffect(() => {
        setEditorContent(data.body || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const previewUrl = useMemo(() => {
        if (!data.image) return null;
        return URL.createObjectURL(data.image);
    }, [data.image]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleChangeContent = (value: string) => {
        setEditorContent(value);
        debouncedSyncBody(value);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // ensure latest editor content is saved
        setData('body', editorContent);

        post('/admin/news', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setEditorContent('');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Berita" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Buat Berita</h1>
                    <p className="text-sm text-muted-foreground">
                        Berita sederhana dengan 1 gambar header + konten rich
                        text.
                    </p>
                </div>

                <Card className="p-4 md:p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Judul</Label>
                            <Input
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                placeholder="Judul berita..."
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Rich editor for body */}
                        <div className="space-y-2">
                            <Label>Konten (opsional)</Label>
                            <div className="mt-2">
                                <RichTextEditor
                                    output="html"
                                    content={editorContent}
                                    onChangeContent={handleChangeContent}
                                    extensions={extensions}
                                    label="Tulis isi berita di sini..."
                                    minHeight={240}
                                    maxHeight={520}
                                    maxWidth="100%"
                                    contentClass="min-h-[240px]"
                                />
                            </div>
                            {errors.body && (
                                <p className="text-sm text-destructive">
                                    {errors.body}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Gambar Header (opsional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setData(
                                        'image',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {errors.image && (
                                <p className="text-sm text-destructive">
                                    {errors.image}
                                </p>
                            )}

                            {previewUrl && (
                                <div className="mt-3 overflow-hidden rounded-lg border">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-56 w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Membuat Berita...'
                                    : 'Buat Berita'}
                            </Button>
                            <Button variant="ghost" className="flex-1" asChild>
                                <Link href="/admin/news">Kembali</Link>
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
