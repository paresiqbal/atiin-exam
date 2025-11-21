// react
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// components
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// icons
import { Check, Plus, X } from 'lucide-react';

// types
import type { Question, QuestionOption } from '@/types/question';

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
import { Link } from 'reactjs-tiptap-editor/link';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';

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

            timeoutRef.current = window.setTimeout(() => {
                callback(value);
            }, delay);
        },
        [callback, delay],
    );
}

// editor extensions (defined once)
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
    Link,
    Blockquote,
    HorizontalRule,
    Code,
    CodeBlock,
    Image.configure({
        upload: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/teacher/questions/images', {
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
                console.error('Image upload failed', await response.text());
                throw new Error('Image upload failed');
            }

            const data: { url: string } = await response.json();
            return data.url;
        },
    }),
];

interface QuestionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questionBankId: number;
    editingQuestion: Question | null;
}

type FormData = {
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_select' | 'true_false';
    points: number;
    image_url: string;
    options: QuestionOption[];
};

export function QuestionFormDialog({
    open,
    onOpenChange,
    questionBankId,
    editingQuestion,
}: QuestionFormDialogProps) {
    const { data, setData, post, put, reset, errors } = useForm<FormData>({
        question_text: '',
        question_type: 'multiple_choice',
        points: 5,
        image_url: '',
        options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ],
    });

    // local state for editor only
    const [editorContent, setEditorContent] = useState<string>('');

    // debounced sync from editor -> useForm
    const debouncedSyncQuestionText = useDebouncedCallback<string>((value) => {
        setData('question_text', value);
    }, 300);

    // when dialog opens or editingQuestion changes, hydrate form + editor
    useEffect(() => {
        if (!open) return;

        if (editingQuestion) {
            const initialHtml = editingQuestion.question_text || '';

            setData({
                question_text: initialHtml,
                question_type: editingQuestion.question_type,
                points: editingQuestion.points,
                image_url: editingQuestion.image_url || '',
                options: editingQuestion.options,
            });

            setEditorContent(initialHtml);
        } else {
            reset();
            setData('options', [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ]);
            setEditorContent('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editingQuestion]);

    const handleAddOption = () => {
        setData('options', [
            ...data.options,
            { option_text: '', is_correct: false },
        ]);
    };

    const handleRemoveOption = (index: number) => {
        if (data.options.length > 2) {
            const newOptions = data.options.filter((_, i) => i !== index);
            setData('options', newOptions);
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
                newOptions.forEach((opt, i) => {
                    opt.is_correct = i === index;
                });
            } else {
                newOptions[index] = {
                    ...newOptions[index],
                    is_correct: true,
                };
            }
        } else {
            newOptions[index] = {
                ...newOptions[index],
                [field]: value,
            };
        }

        setData('options', newOptions);
    };

    // editor -> local state + debounced form sync
    const handleChangeContent = (value: string) => {
        setEditorContent(value);
        debouncedSyncQuestionText(value);
    };

    const handleSave = () => {
        // make sure latest editorContent is in form before submit
        setData('question_text', editorContent);

        if (editingQuestion) {
            put(`/teacher/questions/${editingQuestion.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                    setEditorContent('');
                },
            });
        } else {
            post(`/teacher/question-banks/${questionBankId}/questions`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                    setEditorContent('');
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>
                        {editingQuestion ? 'Edit Soal' : 'Buat Soal'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Question text (Rich editor) */}
                    <div>
                        <label className="text-sm font-medium">Soal</label>

                        <div className="mt-2">
                            <RichTextEditor
                                output="html"
                                content={editorContent}
                                onChangeContent={handleChangeContent}
                                extensions={extensions}
                                label="Tulis soal di sini..."
                                minHeight={200}
                                maxHeight={400}
                                maxWidth="100%"
                                contentClass="min-h-[200px]"
                            />
                        </div>

                        {errors.question_text && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.question_text}
                            </p>
                        )}
                    </div>

                    {/* Question type & points */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">
                                Tipe Soal
                            </label>
                            <Select
                                value={data.question_type}
                                onValueChange={(val) =>
                                    setData(
                                        'question_type',
                                        val as FormData['question_type'],
                                    )
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple_choice">
                                        Pilihan Ganda
                                    </SelectItem>
                                    <SelectItem value="multiple_select">
                                        Pilihan Ganda (Beberapa Jawaban)
                                    </SelectItem>
                                    <SelectItem value="true_false">
                                        Benar/Salah
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Point</label>
                            <Input
                                type="number"
                                min="1"
                                max="45"
                                value={data.points}
                                onChange={(e) =>
                                    setData('points', Number(e.target.value))
                                }
                                className="mt-1"
                            />
                            {errors.points && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.points}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Optional image URL outside editor */}
                    <div>
                        <label className="text-sm font-medium">Image URL</label>
                        <Input
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) =>
                                setData('image_url', e.target.value)
                            }
                            className="mt-1"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Opsi Jawaban
                        </label>
                        <div className="space-y-2">
                            {data.options.map((option, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        placeholder={`Opsi ${idx + 1}`}
                                        value={option.option_text}
                                        onChange={(e) =>
                                            handleOptionChange(
                                                idx,
                                                'option_text',
                                                e.target.value,
                                            )
                                        }
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            option.is_correct
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            handleOptionChange(
                                                idx,
                                                'is_correct',
                                                !option.is_correct,
                                            )
                                        }
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    {data.options.length > 2 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleRemoveOption(idx)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOption}
                            className="mt-2 gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Opsi
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSave}>
                            {editingQuestion ? 'Perbarui' : 'Buat Soal'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
