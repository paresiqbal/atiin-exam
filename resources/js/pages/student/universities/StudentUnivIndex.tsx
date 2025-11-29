// resources/js/pages/student/universities/StudentUnivIndex.tsx

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

interface Major {
    id: number;
    name: string;
    description?: string;
    minimum_passing_grade: number;
}

interface University {
    id: number;
    name: string;
    city: string;
    country: string;
    website?: string;
    description?: string;
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Student Dashboard',
        href: '/student/dashboard',
    },
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

    // Filter universities based on search query
    const filteredUniversities = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return universities.filter((uni) => {
            const matchesName = uni.name.toLowerCase().includes(q);
            const matchesCity = uni.city.toLowerCase().includes(q);
            const matchesMajor = uni.majors?.some((major) =>
                major.name.toLowerCase().includes(q),
            );
            return matchesName || matchesCity || !!matchesMajor;
        });
    }, [searchQuery, universities]);

    const totalPrograms = universities.reduce(
        (acc, uni) => acc + (uni.majors?.length || 0),
        0,
    );

    const handleOpenUniversity = (uni: University) => {
        setSelectedUniversity(uni);
        setShowComparison(false); // reset comparison each time you open a university
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Universities" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Explore Universities
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Discover universities and their academic programs
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            This data is up to date for {currentYear}.
                        </p>
                    </div>

                    {/* Latest exam info (if exists) */}
                    {latest_exam && student_latest_score !== null && (
                        <Card>
                            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        Latest Exam: {latest_exam.exam_name}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Completed on:{' '}
                                        {latest_exam.completed_at ?? '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                        Your score
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
                            placeholder="Search universities or majors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-10 text-base"
                        />
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Universities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {universities.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Programs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {totalPrograms}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Results Found
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {filteredUniversities.length}
                                </div>
                            </CardContent>
                        </Card>
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
                                                        📍 {university.city},{' '}
                                                        {university.country}
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
                                                                            {
                                                                                major.name
                                                                            }
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
                                                                    more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Action Button */}
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
                                                View Details
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
                                            No universities found
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Try adjusting your search query
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedUniversity && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
                                        📍 {selectedUniversity.city},{' '}
                                        {selectedUniversity.country}
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
                                        About
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
                                                Available Programs
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
                                                                {major.name}
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
                                                                    Min. Grade:{' '}
                                                                    {
                                                                        major.minimum_passing_grade
                                                                    }
                                                                </Badge>

                                                                {showComparison &&
                                                                    student_latest_score !==
                                                                        null && (
                                                                        <p
                                                                            className={
                                                                                'text-xs ' +
                                                                                (meets
                                                                                    ? 'text-green-600 dark:text-green-400'
                                                                                    : 'text-red-600 dark:text-red-400')
                                                                            }
                                                                        >
                                                                            {meets
                                                                                ? 'You can enter this program.'
                                                                                : 'You cannot enter this program yet.'}
                                                                        </p>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Website Link */}
                            {selectedUniversity.website && (
                                <div>
                                    <a
                                        href={selectedUniversity.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Visit University Website →
                                    </a>
                                </div>
                            )}

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleCompareClick}
                            >
                                Compare Grade
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
                                <DialogTitle>No Exam Score Found</DialogTitle>
                            </DialogHeader>

                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                You haven’t completed any exam yet. Please
                                finish a test first so we can compare your score
                                with the university program requirements.
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
