import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

export default function WaitingResult() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Ujian', href: '/student/exams' },
                { title: 'Hasil', href: '#' },
            ]}
        >
            <Head title="Hasil Ujian Menunggu" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Hasil Ujian Menunggu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Your exam has been submitted. Results will be
                            released after all participants finish.
                        </p>
                        <div>
                            <Button asChild variant="outline">
                                <Link href="/student/exams">
                                    Kembali ke Daftar Ujian
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
