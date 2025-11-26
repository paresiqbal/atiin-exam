'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
}: StudentUnivIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] =
        useState<University | null>(null);

    // Filter universities based on search query
    const filteredUniversities = useMemo(() => {
        return universities.filter(
            (uni) =>
                uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                uni.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                uni.majors?.some((major) =>
                    major.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                ),
        );
    }, [searchQuery, universities]);

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
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
                                    {universities.reduce(
                                        (acc, uni) =>
                                            acc + (uni.majors?.length || 0),
                                        0,
                                    )}
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
                                            setSelectedUniversity(university)
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
                                                onClick={() =>
                                                    setSelectedUniversity(
                                                        university,
                                                    )
                                                }
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
                    onClick={() => setSelectedUniversity(null)}
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
                                    onClick={() => setSelectedUniversity(null)}
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
                                                (major) => (
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
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="border-blue-200 bg-blue-50 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                            >
                                                                Min. Grade:{' '}
                                                                {
                                                                    major.minimum_passing_grade
                                                                }
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ),
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

                            <Button className="w-full" size="lg">
                                Enroll Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}
