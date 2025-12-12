import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Major {
    id: number;
    name: string | null;
    description?: string | null;
    minimum_passing_grade: number;
}

interface University {
    id: number;
    name: string;
    city: string | null;
    country: string;
    website?: string | null;
    description?: string | null;
    majors?: Major[];
}

interface StudentUnivIndexProps {
    universities: University[];
    student_latest_score: number | null;
    latest_exam?: {
        exam_name: string;
        completed_at: string | null;
        total_score: number;
    } | null;
}

const safeIncludes = (value: string | null | undefined, q: string): boolean =>
    (value ?? '').toLowerCase().includes(q);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Student Dashboard', href: '/student/dashboard' },
    { title: 'Universities', href: '/student/universities' },
];

export default function StudentUnivIndex({
    universities,
    student_latest_score,
    latest_exam,
}: StudentUnivIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] =
        useState<University | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showNoScoreDialog, setShowNoScoreDialog] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'match'>('name');

    const currentYear = new Date().getFullYear();

    // Filter universities by search query
    const filteredUniversities = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return universities;

        return universities.filter((uni) => {
            const matchesName = safeIncludes(uni.name, q);
            const matchesCity = safeIncludes(uni.city, q);
            const matchesMajor = uni.majors?.some((major) =>
                safeIncludes(major.name, q),
            );

            return matchesName || matchesCity || !!matchesMajor;
        });
    }, [searchQuery, universities]);

    // Sort universities
    const sortedUniversities = useMemo(() => {
        if (sortBy === 'match' && student_latest_score !== null) {
            return [...filteredUniversities].sort((a, b) => {
                const aQualified =
                    a.majors?.filter(
                        (m) => student_latest_score >= m.minimum_passing_grade,
                    ).length ?? 0;
                const bQualified =
                    b.majors?.filter(
                        (m) => student_latest_score >= m.minimum_passing_grade,
                    ).length ?? 0;
                return bQualified - aQualified;
            });
        }
        return filteredUniversities;
    }, [filteredUniversities, sortBy, student_latest_score]);

    // Calculate qualification count for a university
    const getQualifiedCount = (university: University) => {
        if (!student_latest_score || !university.majors) return 0;
        return university.majors.filter(
            (m) => student_latest_score >= m.minimum_passing_grade,
        ).length;
    };

    const handleOpenUniversity = (uni: University) => {
        setSelectedUniversity(uni);
        // Auto-show comparison if student has a score
        if (student_latest_score !== null) {
            setShowComparison(true);
        } else {
            setShowComparison(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedUniversity(null);
        setShowComparison(false);
    };

    const handleToggleComparison = () => {
        if (!student_latest_score) {
            setShowNoScoreDialog(true);
            return;
        }
        setShowComparison(!showComparison);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Universitas" />

            <div className="p-4">
                <div className="mx-auto max-w-3xl space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold text-foreground">
                            Jelajahi Universitas
                        </h1>
                        <p className="text-muted-foreground">
                            Temukan universitas dan program akademiknya
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Data ini diperbarui untuk tahun {currentYear}.
                        </p>
                    </div>

                    {/* Latest exam info */}
                    {latest_exam && student_latest_score !== null && (
                        <Card className="rounded-2xl">
                            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                                <div className="space-y-1">
                                    <p className="font-semibold text-foreground">
                                        Ujian Terbaru: {latest_exam.exam_name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Selesai pada:{' '}
                                        {latest_exam.completed_at ?? '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                        Skor Anda
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {student_latest_score}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari universitas atau program studi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 rounded-2xl pr-10 pl-10 text-base"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Sort Options */}
                    {student_latest_score !== null &&
                        filteredUniversities.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant={
                                        sortBy === 'name'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setSortBy('name')}
                                    className="rounded-full"
                                >
                                    Urutkan Nama
                                </Button>
                                <Button
                                    variant={
                                        sortBy === 'match'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setSortBy('match')}
                                    className="rounded-full"
                                >
                                    Paling Cocok
                                </Button>
                            </div>
                        )}

                    {/* Universities Grid */}
                    <div className="space-y-4">
                        {universities.length === 0 ? (
                            <Card className="rounded-2xl py-16 text-center">
                                <CardContent className="space-y-3">
                                    <BookOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            Belum ada universitas
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Data universitas akan segera
                                            ditambahkan
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : sortedUniversities.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {sortedUniversities.map((university) => {
                                    const qualifiedCount =
                                        getQualifiedCount(university);
                                    const totalPrograms =
                                        university.majors?.length ?? 0;

                                    return (
                                        <Card
                                            key={university.id}
                                            className="cursor-pointer rounded-2xl transition-shadow hover:shadow-lg"
                                            onClick={() =>
                                                handleOpenUniversity(university)
                                            }
                                        >
                                            <CardHeader>
                                                <div className="space-y-2">
                                                    <CardTitle className="truncate text-lg">
                                                        {university.name}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2">
                                                        <span>
                                                            📍{' '}
                                                            {university.city ??
                                                                'Tidak ada data'}
                                                            ,{' '}
                                                            {university.country}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {university.description && (
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                        {university.description}
                                                    </p>
                                                )}

                                                {/* Majors */}
                                                {university.majors &&
                                                    university.majors.length >
                                                        0 && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                                <BookOpen className="h-4 w-4" />
                                                                Programs (
                                                                {
                                                                    university
                                                                        .majors
                                                                        .length
                                                                }
                                                                )
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {university.majors
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            major,
                                                                        ) => (
                                                                            <Badge
                                                                                key={
                                                                                    major.id
                                                                                }
                                                                                variant="secondary"
                                                                                className="text-xs"
                                                                            >
                                                                                {major.name ??
                                                                                    'Tidak ada nama'}
                                                                            </Badge>
                                                                        ),
                                                                    )}
                                                                {university
                                                                    .majors
                                                                    .length >
                                                                    3 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        +
                                                                        {university
                                                                            .majors
                                                                            .length -
                                                                            3}{' '}
                                                                        lagi
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Qualification Badge */}
                                                {student_latest_score !==
                                                    null &&
                                                    qualifiedCount > 0 && (
                                                        <Badge className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200">
                                                            ✓ Lolos{' '}
                                                            {qualifiedCount}{' '}
                                                            dari {totalPrograms}{' '}
                                                            program
                                                        </Badge>
                                                    )}

                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenUniversity(
                                                            university,
                                                        );
                                                    }}
                                                >
                                                    Lihat Detail
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-2xl py-12 text-center">
                                <CardContent className="space-y-4">
                                    <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            Tidak ada universitas ditemukan
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Coba sesuaikan kueri pencarian Anda
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* ================== DETAILS DIALOG ================== */}
            <Dialog
                open={!!selectedUniversity}
                onOpenChange={(open) => {
                    if (!open) handleCloseModal();
                }}
            >
                <DialogContent className="max-h-[85vh] w-[95vw] max-w-xl overflow-y-auto rounded-2xl p-0">
                    {/* Header */}
                    <div className="space-y-1 border-b px-5 py-4">
                        <DialogHeader>
                            <DialogTitle className="text-lg">
                                {selectedUniversity?.name}
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-sm text-muted-foreground">
                            📍 {selectedUniversity?.city ?? 'Tidak ada data'},{' '}
                            {selectedUniversity?.country}
                        </p>

                        {/* Feedback when compare applied */}
                        {showComparison && student_latest_score !== null && (
                            <div className="pt-2 text-xs text-green-600 dark:text-green-400">
                                ✅ Mode perbandingan aktif — program ditandai
                                sesuai skor Anda
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-5 px-5 py-4">
                        {/* About */}
                        {selectedUniversity?.description && (
                            <div className="space-y-2">
                                <div className="text-sm font-semibold">
                                    Tentang
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {selectedUniversity.description}
                                </p>

                                {/* Website moved here */}
                                {selectedUniversity.website && (
                                    <a
                                        href={selectedUniversity.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex text-sm text-primary hover:underline"
                                    >
                                        Kunjungi Website Universitas →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Programs List */}
                        {selectedUniversity?.majors &&
                        selectedUniversity.majors.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <BookOpen className="h-4 w-4" />
                                    Program Tersedia
                                </div>

                                <div className="space-y-3">
                                    {selectedUniversity.majors.map((major) => {
                                        const meets =
                                            showComparison &&
                                            student_latest_score !== null
                                                ? student_latest_score >=
                                                  major.minimum_passing_grade
                                                : null;

                                        const pointsNeeded =
                                            student_latest_score !== null &&
                                            !meets &&
                                            meets !== null
                                                ? major.minimum_passing_grade -
                                                  student_latest_score
                                                : 0;

                                        const progress =
                                            student_latest_score !== null
                                                ? Math.min(
                                                      (student_latest_score /
                                                          major.minimum_passing_grade) *
                                                          100,
                                                      100,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={major.id}
                                                className="rounded-2xl border bg-card p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium">
                                                            {major.name ??
                                                                'Tidak ada nama'}
                                                        </div>

                                                        {major.description && (
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {
                                                                    major.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Status badge when comparing */}
                                                    {showComparison &&
                                                        meets !== null && (
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    meets
                                                                        ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200'
                                                                        : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
                                                                }
                                                            >
                                                                {meets
                                                                    ? 'Lolos'
                                                                    : 'Belum'}
                                                            </Badge>
                                                        )}
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            'text-xs ' +
                                                            (meets === null
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
                                                                : meets
                                                                  ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200'
                                                                  : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200')
                                                        }
                                                    >
                                                        Minimal Nilai:{' '}
                                                        {
                                                            major.minimum_passing_grade
                                                        }
                                                    </Badge>

                                                    {/* Progress bar for close calls */}
                                                    {!meets &&
                                                        meets !== null &&
                                                        showComparison &&
                                                        student_latest_score !==
                                                            null && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">
                                                                    Butuh{' '}
                                                                    {
                                                                        pointsNeeded
                                                                    }{' '}
                                                                    poin lagi
                                                                </p>
                                                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full bg-primary transition-all duration-300"
                                                                        style={{
                                                                            width: `${progress}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada program tersedia
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t px-5 py-4">
                        <div className="flex flex-col gap-2">
                            {student_latest_score !== null && (
                                <Button
                                    variant={
                                        showComparison ? 'outline' : 'default'
                                    }
                                    className="w-full"
                                    onClick={handleToggleComparison}
                                >
                                    {showComparison
                                        ? 'Sembunyikan Perbandingan'
                                        : 'Tampilkan Perbandingan'}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCloseModal}
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* No Score Dialog */}
            <Dialog
                open={showNoScoreDialog}
                onOpenChange={setShowNoScoreDialog}
            >
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Tidak ada skor ujian</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                        Anda belum menyelesaikan ujian apapun. Silakan
                        selesaikan sebuah ujian terlebih dahulu agar kami dapat
                        membandingkan skor Anda.
                    </p>

                    <DialogFooter>
                        <Button
                            onClick={() => setShowNoScoreDialog(false)}
                            className="w-full"
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
