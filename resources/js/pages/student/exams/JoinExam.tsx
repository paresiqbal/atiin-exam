import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Check, ClipboardPaste, GraduationCap } from 'lucide-react';
import { useState } from 'react';

interface Exam {
    id: number;
    name: string;
    description: string | null;
    start_at: string;
    end_at: string;
    settings: {
        time_limit_minutes: number;
    } | null;
}

interface Props {
    exam?: Exam | null;
}

export default function JoinExam({ exam }: Props) {
    const { data, setData, post, processing, errors } = useForm({ token: '' });
    const [pasteFeedback, setPasteFeedback] = useState(false);

    const handlePasteToken = async () => {
        try {
            setData('token', (await navigator.clipboard.readText()).trim());
            setPasteFeedback(true);
            setTimeout(() => setPasteFeedback(false), 2000);
        } catch {
            // The token remains manually enterable when clipboard access is unavailable.
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/student/exams/start');
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Masuk Ujian" />

            <div className="min-h-screen bg-background p-4 md:p-6">
                <div className="mx-auto max-w-xl space-y-4">
                    <div className="space-y-2 text-center">
                        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <GraduationCap className="h-7 w-7 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Masuk Ujian
                        </h1>
                        <p className="text-muted-foreground">
                            Masukkan token ujian untuk memulai.
                        </p>
                    </div>

                    {exam && (
                        <Alert className="rounded-2xl border-border bg-card">
                            <AlertDescription className="grid gap-2 text-sm md:grid-cols-2">
                                <div>
                                    <div className="text-xs text-muted-foreground">Ujian</div>
                                    <div className="font-medium text-foreground">{exam.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Durasi</div>
                                    <div className="font-medium text-foreground">
                                        {exam.settings?.time_limit_minutes ?? 90} menit
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle>Token Ujian</CardTitle>
                            <CardDescription>
                                Token diberikan oleh admin atau pengawas ujian.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="token">Token</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="token"
                                            autoComplete="off"
                                            placeholder="Masukkan token ujian"
                                            value={data.token}
                                            onChange={(event) => setData('token', event.target.value)}
                                            className={errors.token ? 'border-destructive' : ''}
                                        />
                                        <Button type="button" variant="outline" onClick={handlePasteToken}>
                                            {pasteFeedback ? <Check className="h-4 w-4" /> : <ClipboardPaste className="h-4 w-4" />}
                                            <span className="sr-only">Tempel token</span>
                                        </Button>
                                    </div>
                                    {errors.token && <p className="text-sm text-destructive">{errors.token}</p>}
                                </div>

                                <Button className="w-full" type="submit" disabled={processing}>
                                    {processing ? 'Memulai Ujian...' : 'Mulai Ujian'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
