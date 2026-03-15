import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlignJustify as AlignJustifyIcon,
    Check,
    Plus,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    X,
} from 'lucide-react';
import type { AnyExtension } from '@tiptap/core';
import type { BreadcrumbItem } from '@/types';
import type { Question, QuestionBank, QuestionOption } from '@/types/question';

import TiptapSubscript from '@tiptap/extension-subscript';
import TiptapSuperscript from '@tiptap/extension-superscript';
import QuestionBulkImport from '@/components/QuestionBulkImport';
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
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';

// ── CSRF helper ───────────────────────────────────────────────────────────────
function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return meta?.content ?? '';
}

async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/admin/questions/upload-image', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
        },
        body: formData,
        credentials: 'same-origin',
    });

    if (!response.ok) throw new Error('Image upload failed');
    const data: { url: string } = await response.json();
    return data.url;
}

// ── Typed editor interface for custom toolbar commands ────────────────────────
// Reactjs-tiptap-editor bundles its own @tiptap/core version, so we define
// a narrow interface for only the commands we need to avoid cross-version conflicts.
interface ExtendedChain {
    focus(): this & { run(): boolean };
    run(): boolean;
    toggleSubscript(): this & { run(): boolean };
    toggleSuperscript(): this & { run(): boolean };
    setTextAlign(align: string): this & { run(): boolean };
}

interface ExtendedEditor {
    chain(): ExtendedChain;
    isActive(name: string): boolean;
    isActive(attrs: Record<string, unknown>): boolean;
}

// ── Extension arrays ──────────────────────────────────────────────────────────
// TiptapSubscript/Superscript come from a different @tiptap/core version than
// reactjs-tiptap-editor bundles internally. The double cast via `unknown` is the
// TypeScript-idiomatic way to bridge two structurally compatible but nominally
// different types — no information is lost at runtime since they are the same API.
const sub = TiptapSubscript as unknown as AnyExtension;
const sup = TiptapSuperscript as unknown as AnyExtension;

const questionExtensions: AnyExtension[] = [
    BaseKit.configure({
        placeholder: { showOnlyCurrent: true },
        characterCount: { limit: 50_000 },
    }) as AnyExtension,
    History as AnyExtension,
    Bold as AnyExtension,
    Italic as AnyExtension,
    TextUnderline as AnyExtension,
    BulletList as AnyExtension,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
    }) as AnyExtension,
    Blockquote as AnyExtension,
    HorizontalRule as AnyExtension,
    Code as AnyExtension,
    CodeBlock as AnyExtension,
    Image.configure({
        upload: async (file: File) => uploadImage(file),
    }) as AnyExtension,
    sub,
    sup,
];

const optionExtensions: AnyExtension[] = [
    BaseKit.configure({
        placeholder: { showOnlyCurrent: true },
        characterCount: false,
    }) as AnyExtension,
    History as AnyExtension,
    Bold as AnyExtension,
    Italic as AnyExtension,
    TextUnderline as AnyExtension,
    TextAlign.configure({
        types: ['paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
    }) as AnyExtension,
    sub,
    sup,
];

// ── Toolbar extra buttons (Justify, Subscript, Superscript) ───────────────────
// Rendered via the toolbar.render prop to append after the built-in buttons.
function ExtraToolbarButtons({ editor }: { editor: ExtendedEditor | null }) {
    if (!editor) return null;

    const btnClass = (active: boolean) =>
        `inline-flex h-7 w-7 items-center justify-center rounded border text-xs transition-colors ${
            active
                ? 'border-border bg-accent text-accent-foreground'
                : 'border-transparent hover:bg-muted'
        }`;

    return (
        <>
            <button
                type="button"
                title="Justify"
                onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign('justify').run();
                }}
                className={btnClass(editor.isActive({ textAlign: 'justify' }))}
            >
                <AlignJustifyIcon className="h-3.5 w-3.5" />
            </button>

            <button
                type="button"
                title="Subscript"
                onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleSubscript().run();
                }}
                className={btnClass(editor.isActive('subscript'))}
            >
                <SubscriptIcon className="h-3.5 w-3.5" />
            </button>

            <button
                type="button"
                title="Superscript"
                onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleSuperscript().run();
                }}
                className={btnClass(editor.isActive('superscript'))}
            >
                <SuperscriptIcon className="h-3.5 w-3.5" />
            </button>
        </>
    );
}

// toolbar.render factory — used by both editors
function makeToolbarRender() {
    return (
        _props: { editor: unknown },
        _items: unknown,
        dom: React.ReactNode,
        containerDom: (inner: React.ReactNode) => React.ReactNode,
    ) => {
        const ed = _props.editor as ExtendedEditor | null;
        return containerDom(
            <>
                {dom}
                <ExtraToolbarButtons editor={ed} />
            </>,
        );
    };
}

// ── OptionEditor ──────────────────────────────────────────────────────────────
function OptionEditor({
    value,
    placeholder,
    onChange,
}: {
    value: string;
    placeholder?: string;
    onChange: (val: string) => void;
}) {
    return (
        <div className="min-w-0 flex-1">
            <RichTextEditor
                output="html"
                content={value}
                onChangeContent={onChange}
                extensions={optionExtensions}
                label={placeholder ?? 'Tulis jawaban…'}
                minHeight={56}
                maxHeight={140}
                maxWidth="100%"
                contentClass="min-h-[56px] text-sm"
                showCharactersCount={false}
                toolbar={{ render: makeToolbarRender() }}
            />
        </div>
    );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
    questionBank: QuestionBank;
    question: Question | null;
}

type FormData = {
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_select' | 'true_false';
    points: number;
    image_url: string;
    options: QuestionOption[];
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuestionFormPage({ questionBank, question }: Props) {
    const isEditing = !!question;

    const { data, setData, post, put, errors, processing, reset } =
        useForm<FormData>({
            question_text: question?.question_text ?? '',
            question_type: question?.question_type ?? 'multiple_choice',
            points:        question?.points        ?? 5,
            image_url:     question?.image_url     ?? '',
            options:       question?.options ?? [
                { option_text: '', image_url: '', is_correct: false },
                { option_text: '', image_url: '', is_correct: false },
            ],
        });

    const [editorContent, setEditorContent] = useState<string>(
        () => question?.question_text ?? data.question_text ?? '',
    );
    const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);

    const handleEditorChange = (value: string) => {
        setEditorContent(value);
        setData('question_text', value);
    };

    const handleAddOption = () => {
        setData('options', [
            ...data.options,
            { option_text: '', image_url: '', is_correct: false },
        ]);
    };

    const handleRemoveOption = (index: number) => {
        if (data.options.length > 2) {
            setData('options', data.options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = <K extends keyof QuestionOption>(
        index: number,
        field: K,
        value: QuestionOption[K],
    ) => {
        const newOptions = [...data.options];

        if (field === 'is_correct' && value === true) {
            if (data.question_type === 'multiple_choice') {
                newOptions.forEach((opt, i) => { opt.is_correct = i === index; });
            } else {
                newOptions[index] = { ...newOptions[index], is_correct: true };
            }
        } else {
            newOptions[index] = { ...newOptions[index], [field]: value };
        }

        setData('options', newOptions);
    };

    const handleOptionImageChange = async (index: number, file: File | null) => {
        if (!file) return;
        setUploadingOptionIndex(index);
        try {
            const url = await uploadImage(file);
            handleOptionChange(index, 'image_url', url);
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingOptionIndex(null);
        }
    };

    const backToBank = () =>
        router.visit(`/admin/question-banks/${questionBank.id}`, {
            replace: true,
            preserveScroll: true,
            preserveState: false,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && question) {
            put(`/admin/questions/${question.id}`, {
                onSuccess: () => { toast.success('Soal berhasil diperbarui'); reset(); backToBank(); },
                onError:   () => toast.error('Gagal memperbarui soal'),
            });
        } else {
            post(`/admin/question-banks/${questionBank.id}/questions`, {
                onSuccess: () => { toast.success('Soal berhasil dibuat'); reset(); backToBank(); },
                onError:   () => toast.error('Gagal menyimpan soal, periksa input'),
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Bank Soal',       href: '/admin/question-banks' },
        { title: questionBank.name, href: `/admin/question-banks/${questionBank.id}` },
        { title: isEditing ? 'Edit Soal' : 'Buat Soal', href: '#' },
    ];

    const optionLabel = (idx: number) => ('ABCDEFGHIJKLMNOPQRSTUVWXYZ')[idx] ?? String(idx + 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Soal' : 'Buat Soal'} />

            <div className="p-4">
                {!isEditing && <QuestionBulkImport questionBankId={questionBank.id} />}

                <Card className="max-w-screen">
                    <CardHeader>
                        <CardTitle>{isEditing ? 'Edit Soal' : 'Buat Soal Baru'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ── Question text ── */}
                            <div>
                                <label className="text-sm font-medium">Soal</label>
                                <div className="mt-2">
                                    <RichTextEditor
                                        output="html"
                                        content={editorContent}
                                        onChangeContent={handleEditorChange}
                                        extensions={questionExtensions}
                                        label="Tulis soal di sini..."
                                        minHeight={200}
                                        maxHeight={400}
                                        maxWidth="100%"
                                        contentClass="min-h-[200px]"
                                        toolbar={{ render: makeToolbarRender() }}
                                    />
                                </div>
                                {errors.question_text && (
                                    <p className="mt-1 text-xs text-red-500">{errors.question_text}</p>
                                )}
                            </div>

                            {/* ── Type & Points ── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Tipe Soal</label>
                                    <Select
                                        value={data.question_type}
                                        onValueChange={(val) => setData('question_type', val as FormData['question_type'])}
                                    >
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                                            <SelectItem value="multiple_select">Pilihan Ganda (Beberapa Jawaban)</SelectItem>
                                            <SelectItem value="true_false">Benar/Salah</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Point</label>
                                    <Input
                                        type="number" min="1" max="100"
                                        value={data.points}
                                        onChange={(e) => setData('points', Number(e.target.value))}
                                        className="mt-1"
                                    />
                                    {errors.points && (
                                        <p className="mt-1 text-xs text-red-500">{errors.points}</p>
                                    )}
                                </div>
                            </div>

                            {/* ── Image URL ── */}
                            <div>
                                <label className="text-sm font-medium">Image URL</label>
                                <Input
                                    placeholder="https://..."
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            {/* ── Options ── */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">Opsi Jawaban</label>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Gunakan toolbar <strong>B</strong> <em>I</em> <u>U</u> pada setiap opsi untuk memformat teks jawaban.
                                </p>

                                <div className="space-y-3">
                                    {data.options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded-lg border p-3 transition-colors ${
                                                option.is_correct
                                                    ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                                                    : 'border-border bg-background'
                                            }`}
                                        >
                                            {/* Header */}
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        option.is_correct ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {optionLabel(idx)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {option.is_correct ? 'Jawaban benar' : 'Opsi jawaban'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button" size="sm"
                                                        variant={option.is_correct ? 'default' : 'outline'}
                                                        className={`h-7 gap-1 text-xs ${option.is_correct ? 'border-green-600 bg-green-600 hover:bg-green-700' : ''}`}
                                                        onClick={() => handleOptionChange(idx, 'is_correct', !option.is_correct)}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        {option.is_correct ? 'Benar' : 'Tandai Benar'}
                                                    </Button>

                                                    {data.options.length > 2 && (
                                                        <Button
                                                            type="button" size="sm" variant="ghost"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                                            onClick={() => handleRemoveOption(idx)}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <OptionEditor
                                                value={option.option_text}
                                                placeholder={`Tulis opsi ${optionLabel(idx)}…`}
                                                onChange={(val) => handleOptionChange(idx, 'option_text', val)}
                                            />

                                            {/* Option image */}
                                            <div className="mt-2 flex items-center gap-3">
                                                <Input
                                                    type="file" accept="image/*"
                                                    onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0] ?? null)}
                                                    className="max-w-xs text-xs"
                                                />
                                                {uploadingOptionIndex === idx && (
                                                    <span className="text-xs text-muted-foreground">Uploading…</span>
                                                )}
                                                {option.image_url && (
                                                    <>
                                                        <img
                                                            src={option.image_url}
                                                            alt={`Opsi ${optionLabel(idx)}`}
                                                            className="h-10 w-10 rounded border object-cover"
                                                        />
                                                        <Button
                                                            type="button" size="sm" variant="ghost"
                                                            className="h-7 text-xs text-muted-foreground hover:text-red-500"
                                                            onClick={() => handleOptionChange(idx, 'image_url', '')}
                                                        >
                                                            Hapus Gambar
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button" variant="outline" size="sm"
                                    onClick={handleAddOption}
                                    className="mt-3 gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Opsi
                                </Button>
                            </div>

                            {/* ── Actions ── */}
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? isEditing ? 'Menyimpan…' : 'Membuat…'
                                        : isEditing ? 'Simpan Perubahan' : 'Buat Soal'
                                    }
                                </Button>
                                <Button
                                    type="button" variant="outline"
                                    onClick={() => router.visit(`/admin/question-banks/${questionBank.id}`, { replace: true, preserveState: false })}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}