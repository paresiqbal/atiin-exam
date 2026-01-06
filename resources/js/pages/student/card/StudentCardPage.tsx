import StudentCard from '@/components/StudentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export default function StudentCardPage() {
    const { props } = usePage<{
        student: {
            name: string;
            student_id: string;
            school?: string | null;
            class?: string | null;
            photo_url?: string | null;
        };
        auth: {
            user?: { is_pro?: boolean };
        };
        flash?: { success?: string };
    }>();

    const { data, setData, post, processing, errors, progress } = useForm<{
        photo: File | null;
    }>({
        photo: null,
    });

    const localPreviewUrl = useMemo(() => {
        if (!data.photo) return null;
        return URL.createObjectURL(data.photo);
    }, [data.photo]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/student/card/photo', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Kartu Siswa" />

            <div className="mx-auto max-w-xl space-y-4 p-4">
                <h1 className="text-xl font-semibold">Kartu Siswa</h1>

                <StudentCard
                    templateUrl="/assets/card.png"
                    name={props.student.name}
                    studentId={props.student.student_id}
                    school={props.student.school}
                    className={props.student.class}
                    isPro={!!props.auth.user?.is_pro}
                    photoUrl={
                        localPreviewUrl ?? props.student.photo_url ?? null
                    }
                />

                <div className="space-y-3 rounded-xl border p-4">
                    <div className="text-sm font-medium">Upload Foto</div>

                    {props.flash?.success && (
                        <div className="text-sm text-green-600">
                            {props.flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="photo">
                                Foto siswa (JPG/PNG/WebP)
                            </Label>
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setData(
                                        'photo',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {errors.photo && (
                                <div className="text-sm text-red-500">
                                    {errors.photo}
                                </div>
                            )}
                        </div>

                        {progress && (
                            <div className="text-xs text-muted-foreground">
                                Uploading... {progress.percentage}%
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={processing || !data.photo}
                        >
                            {processing ? 'Uploading...' : 'Simpan Foto'}
                        </Button>
                    </form>

                    <div className="text-xs text-muted-foreground">
                        Tips: pakai foto wajah jelas, rasio 3:4 lebih bagus.
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
