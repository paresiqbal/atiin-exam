import { Head } from '@inertiajs/react';
import { Download, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface Student {
    id: number;
    name: string;
    email: string;
    class?: string | null;
    school?: {
        id: number;
        name: string;
    } | null;
}

interface School {
    id: number;
    name: string;
    students: Student[];
}

interface StudentCardsProps {
    schools: School[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Siswa', href: '/admin/students' },
    { title: 'Kartu Siswa', href: '/admin/students/cards' },
];

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
        (parts[0]?.charAt(0) ?? '').toUpperCase() +
        (parts[1]?.charAt(0) ?? '').toUpperCase()
    );
}

export default function StudentCards({ schools }: StudentCardsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(
        null,
    );
    const [cardsCreated, setCardsCreated] = useState(false);

    // ✅ Only track focus (not openResults)
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const searchWrapRef = useRef<HTMLDivElement | null>(null);

    const filteredSchools = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return schools
            .filter((s) => s.name.toLowerCase().includes(q))
            .slice(0, 20);
    }, [searchQuery, schools]);

    const selectedSchool = useMemo(
        () => schools.find((s) => s.id === selectedSchoolId) ?? null,
        [schools, selectedSchoolId],
    );

    const totalStudents = selectedSchool?.students.length ?? 0;

    // ✅ derived UI state (no effect needed)
    const hasQuery = searchQuery.trim() !== '';
    const showResults = isSearchFocused && hasQuery;

    const helperText = !hasQuery
        ? 'Ketik untuk mencari sekolah.'
        : filteredSchools.length === 0
          ? `Tidak ada sekolah yang cocok dengan "${searchQuery}".`
          : `${filteredSchools.length} sekolah ditemukan. Klik untuk memilih.`;

    const handleSelectSchool = (schoolId: number) => {
        setSelectedSchoolId(schoolId);
        setCardsCreated(false);
        setIsSearchFocused(false); // close dropdown
    };

    const handleCreateCards = () => {
        if (!selectedSchool) return;
        setCardsCreated(true);
    };

    const handleDownload = () => {
        if (!selectedSchool || !cardsCreated) return;
        const url = `/admin/students/cards/download?school_id=${selectedSchool.id}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kartu Siswa" />

            <div className="flex h-full flex-1 flex-col px-4 py-6 lg:px-6">
                {/* Page header */}
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Kartu Siswa
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Cari sekolah → pilih → buat kartu → download PDF.
                        </p>
                    </div>

                    {selectedSchool && (
                        <div className="rounded-lg border px-3 py-2 text-right text-xs sm:text-sm">
                            <div className="font-medium">
                                {selectedSchool.name}
                            </div>
                            <div className="text-muted-foreground">
                                {totalStudents} siswa terdaftar
                            </div>
                        </div>
                    )}
                </div>

                {/* Search + Actions */}
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                    {/* Search box with dropdown */}
                    <div ref={searchWrapRef} className="relative">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari sekolah… (contoh: SMA Negeri 1)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => {
                                    // Delay close to allow clicking result
                                    window.setTimeout(
                                        () => setIsSearchFocused(false),
                                        120,
                                    );
                                }}
                                className="h-10 pl-9"
                            />
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {helperText}
                        </p>

                        {/* dropdown */}
                        {showResults && (
                            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-md">
                                {filteredSchools.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground">
                                        Tidak ada hasil.
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-auto">
                                        {filteredSchools.map((school) => {
                                            const active =
                                                school.id === selectedSchoolId;
                                            return (
                                                <button
                                                    key={school.id}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        // prevents input blur from cancelling click
                                                        e.preventDefault();
                                                    }}
                                                    onClick={() =>
                                                        handleSelectSchool(
                                                            school.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        'flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition',
                                                        active
                                                            ? 'bg-muted'
                                                            : 'hover:bg-muted/70',
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="line-clamp-1 font-medium">
                                                            {school.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                school.students
                                                                    .length
                                                            }{' '}
                                                            siswa
                                                        </div>
                                                    </div>

                                                    {active && (
                                                        <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                                                            Dipilih
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:min-w-[260px]">
                        <Button
                            type="button"
                            onClick={handleCreateCards}
                            disabled={!selectedSchool}
                            className="h-10 w-full"
                        >
                            {selectedSchool
                                ? `Buat Kartu (${totalStudents})`
                                : 'Pilih sekolah dulu'}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleDownload}
                            variant="outline"
                            disabled={!selectedSchool || !cardsCreated}
                            className="h-10 w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>

                        {!cardsCreated && selectedSchool && (
                            <p className="text-xs text-muted-foreground">
                                Setelah klik <b>Buat Kartu</b>, tombol download
                                akan aktif.
                            </p>
                        )}
                    </div>
                </div>

                {/* Cards area */}
                <Card className="flex flex-1 flex-col">
                    <CardHeader className="space-y-1 border-b">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span>Daftar Kartu Siswa</span>
                            {selectedSchool && cardsCreated && (
                                <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {selectedSchool.name}
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Kartu siswa akan muncul setelah memilih sekolah dan
                            menekan tombol{' '}
                            <span className="font-medium">
                                &quot;Buat Kartu&quot;
                            </span>
                            .
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                        {!selectedSchool || !cardsCreated ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
                                <p>
                                    Cari & pilih sekolah, lalu klik{' '}
                                    <span className="font-medium">
                                        &quot;Buat Kartu&quot;
                                    </span>
                                    .
                                </p>
                                <p>
                                    Setiap siswa akan otomatis dibuatkan kartu
                                    di area ini.
                                </p>
                            </div>
                        ) : selectedSchool.students.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                Tidak ada siswa terdaftar di sekolah ini.
                            </div>
                        ) : (
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
                                {selectedSchool.students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex h-full flex-col rounded-lg border bg-background p-3 text-sm shadow-sm print:shadow-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage
                                                    src=""
                                                    alt={student.name}
                                                />
                                                <AvatarFallback>
                                                    {getInitials(student.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-0.5">
                                                <div className="text-sm leading-tight font-semibold">
                                                    {student.name}
                                                </div>
                                                <div className="text-[11px] leading-tight text-muted-foreground">
                                                    {selectedSchool.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 h-px w-full bg-muted" />

                                        <div className="mt-2 space-y-1.5 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium">
                                                    Email
                                                </span>
                                                <span className="font-mono text-[11px]">
                                                    {student.email}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium">
                                                    Sekolah
                                                </span>
                                                <span>
                                                    {student.school?.name ||
                                                        '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium">
                                                    Kelas
                                                </span>
                                                <span>
                                                    {student.class || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded border border-dashed px-2 py-1 text-center text-[11px] text-muted-foreground">
                                            Placeholder foto siswa — ganti
                                            dengan foto resmi saat siap.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
