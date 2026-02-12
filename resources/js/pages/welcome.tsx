import { login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const getDashboardUrl = () => {
        if (!auth.user) return '/';

        switch (auth.user.role) {
            case 'admin':
                return '/admin/dashboard';
            case 'student':
                return '/student/dashboard';
            default:
                return '/teacher/dashboard';
        }
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen bg-background text-foreground">
                {/* Soft background */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(120,120,120,0.12)_1px,transparent_0)] [background-size:18px_18px] opacity-40" />
                </div>

                {/* Header */}
                <header className="relative z-10 mx-auto max-w-6xl px-6 py-6">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                                <img
                                    src="/assets/attinlogo.png"
                                    alt="ATTIN Logo"
                                    className="h-5 w-5 object-contain"
                                />
                            </div>
                            <div>
                                <div className="text-sm font-semibold">
                                    Bimbel ATTINN
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Ujian & Tryout Platform
                                </div>
                            </div>
                        </div>

                        {auth.user ? (
                            <Link
                                href={getDashboardUrl()}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-muted"
                            >
                                Log in
                            </Link>
                        )}
                    </nav>
                </header>

                {/* Main */}
                <main className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-6 pt-10 pb-20">
                    <div className="max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/15">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Platform ujian online modern
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Kelola ujian dan tryout tanpa ribet.
                        </h1>

                        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                            ATTIN membantu proses ujian jadi lebih rapi, cepat,
                            dan terstruktur. Cocok untuk bimbel, sekolah, dan
                            lembaga pendidikan.
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2">
                            {auth.user ? (
                                <Link
                                    href={getDashboardUrl()}
                                    className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                                >
                                    Masuk ke Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                                >
                                    Log in
                                </Link>
                            )}

                            <a
                                href="https://cloud.laravel.com"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-2xl px-5 py-3 text-sm font-semibold ring-1 ring-border hover:bg-muted"
                            >
                                Kunjungi Website
                            </a>
                        </div>

                        <div className="flex gap-6 pt-4 text-xs text-muted-foreground">
                            <a
                                href="https://www.instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                Instagram
                            </a>
                            <a
                                href="https://www.youtube.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4 hover:text-foreground"
                            >
                                Youtube
                            </a>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-8 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Bimbel ATTIN
                </footer>
            </div>
        </>
    );
}
