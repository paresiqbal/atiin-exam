// react
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

// layout
import AppLayout from '@/layouts/app-layout';

// components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// types
import { BreadcrumbItem } from '@/types';
import { ExamData } from '@/types/exam';

export default function IndexExam({ exams }: { exams: { data: ExamData[] } }) {
    const [examToDelete, setExamToDelete] = useState<ExamData | null>(null);

    const handleConfirmDelete = () => {
        if (!examToDelete) return;

        router.delete(`/admin/exams/${examToDelete.id}`, {
            onFinish: () => setExamToDelete(null),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Daftar Ujian', href: '/admin/exams' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ujian" />
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Daftar Ujian</h1>
                    <Link href="/admin/exams/create">
                        <Button className="bg-primary/90 text-primary-foreground">
                            Buat Ujian
                        </Button>
                    </Link>
                </div>

                {exams.data.length === 0 ? (
                    <Card>
                        <CardContent className="pt-8 text-center text-gray-500">
                            Belum ada ujian yang dibuat.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Nama
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Bank Soal
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Peserta
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.data.map((exam) => (
                                    <tr key={exam.id} className="border-b">
                                        <td className="px-6 py-4 text-sm">
                                            {exam.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {exam.question_bank?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {exam.is_published
                                                    ? 'Publis'
                                                    : 'Draf'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {exam.attempts_count}
                                        </td>
                                        <td className="flex space-x-2 px-6 py-4 text-sm">
                                            <Link
                                                href={`/admin/exams/${exam.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Lihat
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/admin/exams/${exam.id}/edit`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    setExamToDelete(exam)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal for deleting an exam */}
                <AlertDialog
                    open={!!examToDelete}
                    onOpenChange={(open) => !open && setExamToDelete(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Ujian?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {examToDelete
                                    ? `Anda yakin ingin menghapus ujian "${examToDelete.name}"? Jika ujian sudah pernah dikerjakan siswa, ujian tidak dapat dihapus.`
                                    : 'Anda yakin ingin menghapus ujian ini?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => setExamToDelete(null)}
                            >
                                Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleConfirmDelete}
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
