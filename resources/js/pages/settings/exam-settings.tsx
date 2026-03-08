import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Props {
    exam_auto_freeze: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Exam settings',
        href: '/settings/exam',
    },
];

export default function ExamSettings({ exam_auto_freeze }: Props) {
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        exam_auto_freeze,
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        put('/settings/exam', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Exam settings"
                        description="Atur perilaku ujian secara global."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-start gap-3 rounded-lg border p-4">
                            <Checkbox
                                id="exam_auto_freeze"
                                checked={data.exam_auto_freeze}
                                onCheckedChange={(checked) =>
                                    setData(
                                        'exam_auto_freeze',
                                        Boolean(checked),
                                    )
                                }
                            />
                            <div className="space-y-1">
                                <label
                                    htmlFor="exam_auto_freeze"
                                    className="text-sm font-medium"
                                >
                                    Automatic freeze
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Jika aktif, sistem akan membekukan ujian
                                    otomatis ketika pelanggaran melebihi batas.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing} type="submit">
                                Simpan
                            </Button>
                            {recentlySuccessful ? (
                                <p className="text-sm text-muted-foreground">
                                    Tersimpan
                                </p>
                            ) : null}
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
