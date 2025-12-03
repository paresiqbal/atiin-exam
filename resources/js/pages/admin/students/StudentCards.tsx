import { Head } from '@inertiajs/react';
import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

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

import type { BreadcrumbItem } from '@/types';

interface Student {
    id: number;
    name: string;
    email: string;
    class?: string | null;
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
    { title: 'Manajemen Siswa', href: '/admin/students' },
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

    const filteredSchools = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return [];
        }
        return schools.filter((s) => s.name.toLowerCase().includes(q));
    }, [searchQuery, schools]);

    const selectedSchool = useMemo(
        () => schools.find((s) => s.id === selectedSchoolId) ?? null,
        [schools, selectedSchoolId],
    );

    const handleSelectSchool = (schoolId: number) => {
        setSelectedSchoolId(schoolId);
        setCardsCreated(false);
    };

    const handleCreateCards = () => {
        if (!selectedSchool) return;
        setCardsCreated(true);
    };

    const totalStudents = selectedSchool?.students.length ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kartu Siswa" />

            <div className="flex h-full flex-1 flex-col px-4 py-6 lg:px-6">
                {/* Page header */}
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Kartu Siswa
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Cari sekolah, pilih salah satu, lalu buat kartu
                            untuk semua siswa di sekolah tersebut.
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

                {/* Top bar: search + button */}
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama sekolah, contoh: SMA Negeri 1..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-9 text-sm"
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={handleCreateCards}
                        disabled={!selectedSchool}
                        className="w-full sm:w-auto"
                    >
                        {selectedSchool
                            ? `Buat Kartu untuk ${totalStudents} siswa`
                            : 'Pilih sekolah terlebih dahulu'}
                    </Button>
                </div>

                {/* Info text (only when searching) */}
                <div className="mb-3 text-xs text-muted-foreground">
                    {searchQuery.trim() !== '' &&
                        (filteredSchools.length === 0
                            ? `Tidak ada sekolah yang cocok dengan "${searchQuery}".`
                            : `${filteredSchools.length} sekolah ditemukan. Klik salah satu untuk dipilih.`)}
                </div>
                <Button
                    onClick={() => {
                        if (selectedSchool) {
                            window.location.href = `/admin/students/cards/download?school_id=${selectedSchool.id}`;
                        }
                    }}
                    variant="outline"
                    disabled={!cardsCreated}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>

                {/* Search results (only visible when there is a query) */}
                {searchQuery.trim() !== '' && (
                    <div className="mb-6 max-h-72 overflow-auto rounded-lg border bg-background">
                        {filteredSchools.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                Tidak ada sekolah yang cocok dengan kata kunci{' '}
                                <span className="font-medium">
                                    &quot;{searchQuery}&quot;
                                </span>
                                .
                            </div>
                        ) : (
                            filteredSchools.map((school) => {
                                const isActive = school.id === selectedSchoolId;
                                return (
                                    <button
                                        key={school.id}
                                        type="button"
                                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                                            isActive
                                                ? 'bg-muted font-medium'
                                                : 'hover:bg-muted/70'
                                        }`}
                                        onClick={() =>
                                            handleSelectSchool(school.id)
                                        }
                                    >
                                        <div className="flex flex-col">
                                            <span className="line-clamp-1">
                                                {school.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {school.students.length} siswa
                                                terdaftar
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}

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
                            Kartu siswa akan muncul di sini setelah Anda memilih
                            sekolah dan menekan tombol{' '}
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
                                    Cari dan pilih sekolah di bagian atas,
                                    kemudian klik{' '}
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
                                        {/* Header: avatar + name + school */}
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

                                        {/* Divider */}
                                        <div className="mt-3 h-px w-full bg-muted" />

                                        {/* Details */}
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
                                                    Kelas
                                                </span>
                                                <span>
                                                    {student.class || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Photo placeholder */}
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
