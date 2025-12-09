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
import { BookOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

/* ============================================================
   FIXED TYPES – allow null values returned from backend
============================================================ */
interface Major {
    id: number;
    name: string | null;
    description?: string | null;
    minimum_passing_grade: number;
}

interface University {
    id: number;
    name: string;
    city: string | null; // FIXED
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

/* ============================================================
   Safe helper for null / undefined strings
============================================================ */
const safeIncludes = (value: string | null | undefined, q: string): boolean =>
    (value ?? '').toLowerCase().includes(q);

/* ============================================================
   Component
============================================================ */
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

    const currentYear = new Date().getFullYear();

    /* ============================================================
       FIXED SEARCH FILTER (NO MORE toLowerCase ERROR)
    ============================================================ */
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

    const handleOpenUniversity = (uni: University) => {
        setSelectedUniversity(uni);
        setShowComparison(false);
    };

    const handleCloseModal = () => {
        setSelectedUniversity(null);
        setShowComparison(false);
    };

    const handleCompareClick = () => {
        if (!student_latest_score) {
            setShowNoScoreDialog(true);
            return;
        }
        setShowComparison(true);
    };

    /* ============================================================
       UI STARTS HERE
    ============================================================ */
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Universitas" />

            <div className="min-h-screen p-6">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Jelajahi Universitas
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Temukan universitas dan program akademiknya
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            Data ini diperbarui untuk tahun {currentYear}.
                        </p>
                    </div>

                    {/* Latest exam info */}
                    {latest_exam && student_latest_score !== null && (
                        <Card>
                            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        Ujian Terbaru: {latest_exam.exam_name}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Selesai pada:{' '}
                                        {latest_exam.completed_at ?? '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                        Skor Anda
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {student_latest_score}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Cari universitas atau program studi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-10 text-base"
                        />
                    </div>

                    {/* Universities Grid */}
                    <div className="space-y-4">
                        {filteredUniversities.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {filteredUniversities.map((university) => (
                                    <Card
                                        key={university.id}
                                        className="cursor-pointer transition-shadow hover:shadow-lg"
                                        onClick={() =>
                                            handleOpenUniversity(university)
                                        }
                                    >
                                        <CardHeader>
                                            <div className="space-y-2">
                                                <CardTitle className="text-xl">
                                                    {university.name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <span>
                                                        📍{' '}
                                                        {university.city ??
                                                            'Tidak ada data'}
                                                        , {university.country}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            {university.description && (
                                                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                                    {university.description}
                                                </p>
                                            )}

                                            {/* Majors */}
                                            {university.majors &&
                                                university.majors.length >
                                                    0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                                                                    (major) => (
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
                                                            {university.majors
                                                                .length > 3 && (
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

                                            <Button
                                                variant="outline"
                                                className="mt-2 w-full bg-transparent"
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
                                ))}
                            </div>
                        ) : (
                            <Card className="py-12 text-center">
                                <CardContent className="space-y-4">
                                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            Tidak ada universitas ditemukan
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Coba sesuaikan kueri pencarian Anda
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* ================== DETAILS MODAL ================== */}
            {selectedUniversity && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                >
                    <Card
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-2xl">
                                        {selectedUniversity.name}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        📍{' '}
                                        {selectedUniversity.city ??
                                            'Tidak ada data'}
                                        , {selectedUniversity.country}
                                    </CardDescription>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-2xl text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {selectedUniversity.description && (
                                <div>
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                                        Tentang
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {selectedUniversity.description}
                                    </p>
                                </div>
                            )}

                            {/* Programs List */}
                            {selectedUniversity.majors &&
                                selectedUniversity.majors.length > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Program Tersedia
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            {selectedUniversity.majors.map(
                                                (major) => {
                                                    const meets =
                                                        showComparison &&
                                                        student_latest_score !==
                                                            null
                                                            ? student_latest_score >=
                                                              major.minimum_passing_grade
                                                            : null;

                                                    const badgeClasses =
                                                        meets === null
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                            : meets
                                                              ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                              : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300';

                                                    return (
                                                        <div
                                                            key={major.id}
                                                            className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800"
                                                        >
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {major.name ??
                                                                    'Tidak ada nama'}
                                                            </p>

                                                            {major.description && (
                                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                                    {
                                                                        major.description
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className="mt-2 flex flex-col gap-1">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        'text-xs ' +
                                                                        badgeClasses
                                                                    }
                                                                >
                                                                    Minimal
                                                                    Nilai:{' '}
                                                                    {
                                                                        major.minimum_passing_grade
                                                                    }
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}

                            {selectedUniversity.website && (
                                <a
                                    href={selectedUniversity.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Kunjungi Website Universitas →
                                </a>
                            )}

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleCompareClick}
                            >
                                Bandingkan Nilai
                            </Button>
                        </CardContent>
                    </Card>

                    {/* No Score Dialog */}
                    <Dialog
                        open={showNoScoreDialog}
                        onOpenChange={setShowNoScoreDialog}
                    >
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Tidak ada skor ujian</DialogTitle>
                            </DialogHeader>

                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Anda belum menyelesaikan ujian apapun. Silakan
                                selesaikan sebuah ujian terlebih dahulu agar
                                kami dapat membandingkan skor Anda.
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
                </div>
            )}
        </AppLayout>
    );
}
