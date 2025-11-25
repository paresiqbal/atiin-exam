// resources/js/pages/student/exams/IndexExam.tsx

import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

import type { StudentExamIndexProps } from '@/types/exam';

const statusConfig = {
    available: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Tersedia',
    },
    coming_soon: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Segera Hadir',
    },
    ended: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Berakhir',
    },
} as const;

function getStatusBadge(status: keyof typeof statusConfig) {
    const config = statusConfig[status];

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
        >
            {config.label}
        </span>
    );
}

function formatDateTime(date: string) {
    // Adjust locale/options however you like
    return new Date(date).toLocaleString();
}

export default function IndexExam({ exams }: StudentExamIndexProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ujian yang tersedia', href: '/student/exams' },
            ]}
        >
            <Head title="Ujian yang tersedia" />

            <div className="space-y-4 p-4">
                <h1 className="text-3xl font-bold">Ujian yang tersedia</h1>

                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            Tidak ada ujian yang tersedia untuk kelas Anda saat
                            ini.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                        {exams.data.map((exam) => (
                            <Card
                                key={exam.id}
                                className="transition-shadow hover:shadow-lg"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {exam.name}
                                            </CardTitle>

                                            <p className="mt-1 text-sm text-gray-600">
                                                Soal:{' '}
                                                {
                                                    exam.question_bank.questions
                                                        .length
                                                }{' '}
                                                | Waktu:{' '}
                                                {exam.settings.time_limit} menit
                                            </p>
                                        </div>

                                        <div>{getStatusBadge(exam.status)}</div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="text-sm">
                                            <p>
                                                Mulai:{' '}
                                                {formatDateTime(exam.start_at)}
                                            </p>
                                            <p>
                                                Berakhir:{' '}
                                                {formatDateTime(exam.end_at)}
                                            </p>
                                        </div>

                                        {exam.status === 'available' && (
                                            <Link href="/student/exams/join">
                                                <Button className="w-full">
                                                    Mulai Ujian
                                                </Button>
                                            </Link>
                                        )}

                                        {exam.status === 'coming_soon' && (
                                            <Button className="w-full" disabled>
                                                Akan Datang
                                            </Button>
                                        )}

                                        {exam.status === 'ended' && (
                                            <Button className="w-full" disabled>
                                                Ujian Telah Berakhir
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
