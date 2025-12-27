import StudentCard from '@/components/StudentCard';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

export default function StudentCardPage() {
    const { props } = usePage<{
        student: {
            name: string;
            student_id: string;
            school?: string;
            class?: string;
        };
        auth: {
            user?: { is_pro?: boolean };
        };
    }>();

    return (
        <AppLayout>
            <Head title="Kartu Siswa" />

            <div className="mx-auto max-w-xl space-y-4 p-4">
                <h1 className="text-xl font-semibold">Kartu Siswa</h1>

                <StudentCard
                    name={props.student.name}
                    studentId={props.student.student_id}
                    school={props.student.school}
                    className={props.student.class}
                    isPro={!!props.auth.user?.is_pro}
                />
            </div>
        </AppLayout>
    );
}
