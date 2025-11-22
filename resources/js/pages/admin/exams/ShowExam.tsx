import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Option {
    id: number;
    text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    question_text: string;
    type: string;
    points: number;
    options: Option[];
}

interface ExamToken {
    token: string;
}

interface ExamSettings {
    time_limit_minutes: number;
    shuffle_questions: boolean;
    allow_review: boolean;
}

interface QuestionBank {
    questions: Question[];
}

interface ExamData {
    id: number;
    name: string;
    description: string | null;
    is_published: boolean;
    settings: ExamSettings | null;
    question_bank: QuestionBank | null; // <-- snake_case + nullable
    tokens: ExamToken[];
}

interface Props {
    exam: ExamData;
}

export default function ShowExam({ exam }: Props) {
    const [copiedToken, setCopiedToken] = useState(false);

    const handleCopyToken = () => {
        if (exam.tokens[0]) {
            navigator.clipboard.writeText(exam.tokens[0].token);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const handlePublish = () => {
        router.post(`/admin/exams/${exam.id}/publish`);
    };

    const questions = exam.question_bank?.questions ?? [];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin Dashboard', href: '/admin/dashboard' },
                { title: 'Daftar Ujian', href: '/admin/exams' },
                { title: exam.name, href: `/admin/exams/${exam.id}` },
            ]}
        >
            <Head title={exam.name} />
            <div className="space-y-4 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{exam.name}</h1>
                        <p className="mt-2 text-gray-600">
                            {exam.description || (
                                <span className="text-gray-400 italic">
                                    Tidak ada deskripsi ujian.
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Link href={`/admin/exams/${exam.id}/attempts`}>
                            <Button variant="outline">Lihat Percobaan</Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        {!exam.is_published && (
                            <Button
                                onClick={handlePublish}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Terbitkan
                            </Button>
                        )}
                    </div>
                </div>

                {/* Exam Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Ujian</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {exam.settings ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Batas Waktu
                                    </p>
                                    <p className="font-semibold">
                                        {exam.settings.time_limit_minutes}{' '}
                                        minutes
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Status
                                    </p>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            exam.is_published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {exam.is_published
                                            ? 'Published'
                                            : 'Draft'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Acak Soal
                                    </p>
                                    <p className="font-semibold">
                                        {exam.settings.shuffle_questions
                                            ? 'Yes'
                                            : 'No'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Izinkan Review
                                    </p>
                                    <p className="font-semibold">
                                        {exam.settings.allow_review
                                            ? 'Yes'
                                            : 'No'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Tidak ada pengaturan yang dikonfigurasi untuk
                                ujian ini.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Exam Token */}
                <Card>
                    <CardHeader>
                        <CardTitle>Token Ujian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 rounded p-3 font-mono text-sm">
                                {exam.tokens[0]?.token ||
                                    'Tidak ada token tersedia'}
                            </code>
                            {exam.tokens[0] && (
                                <Button
                                    variant="outline"
                                    onClick={handleCopyToken}
                                >
                                    {copiedToken ? 'Copied!' : 'Copy'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pertanyaan ({questions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {questions.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Tidak ada pertanyaan yang ditemukan untuk bank
                                soal ujian ini. bank.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question, idx) => (
                                    <div
                                        key={question.id}
                                        className="rounded border p-4"
                                    >
                                        <div className="flex justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold">
                                                    P{idx + 1}:{' '}
                                                    {question.question_text}
                                                </p>
                                                <p className="mt-2 text-sm text-gray-600">
                                                    Tipe: {question.type} |
                                                    Poin: {question.points}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {question.options.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            option.is_correct
                                                        }
                                                        disabled
                                                        className="h-4 w-4"
                                                    />
                                                    <span
                                                        className={
                                                            option.is_correct
                                                                ? 'font-semibold text-green-600'
                                                                : ''
                                                        }
                                                    >
                                                        {option.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
