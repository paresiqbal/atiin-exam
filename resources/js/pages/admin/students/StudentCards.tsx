import { Head } from '@inertiajs/react';
import { Download, Loader2, Search } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

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
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface Student {
    id: number;
    name: string;
    email: string;
    class?: string | null;
    school?: { id: number; name: string } | null;
    photo_url?: string | null;
}

interface School {
    id: number;
    name: string;
    students: Student[];
}

interface Props {
    schools: School[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin/dashboard' },
    { title: 'Daftar Siswa', href: '/admin/students' },
    { title: 'Kartu Siswa', href: '/admin/students/cards' },
];

function getInitials(name: string) {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    return p.length === 1
        ? p[0].charAt(0).toUpperCase()
        : (p[0]?.charAt(0) ?? '').toUpperCase() +
              (p[1]?.charAt(0) ?? '').toUpperCase();
}

function formatId(id: number) {
    return String(id).padStart(8, '0');
}

type RootLike = {
    render: (node: ReactNode) => void;
    unmount: () => void;
};

// ── Card design (matches StudentCardPage ATTINSEE style) ──────────────────
// Rendered at CARD_W × CARD_H pixels for capture
const CARD_W = 636; // px  (≈ A4 column width at 96dpi)
const CARD_H = 402; // px  (CARD_W / 1.585 — standard ID card ratio)

function AttinseeCard({
    student,
    school,
}: {
    student: Student;
    school: School;
}) {
    return (
        <div
            style={{
                width: CARD_W,
                height: CARD_H,
                fontFamily: 'Arial, Helvetica, sans-serif',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 96,
                    background: '#991b1b',
                }}
            >
                {/* Shine overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.12,
                        background:
                            'radial-gradient(circle at 20% 10%, white, transparent 40%), radial-gradient(circle at 80% 0%, white, transparent 45%)',
                    }}
                />

                {/* Header text */}
                <div
                    style={{
                        position: 'absolute',
                        top: 22,
                        left: 32,
                        right: 32,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: '0.25em',
                                color: 'rgba(254,202,202,0.85)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Kartu Identitas Siswa
                        </div>
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 900,
                                color: '#ffffff',
                                letterSpacing: '-0.03em',
                                marginTop: 2,
                            }}
                        >
                            ATTIN<span style={{ color: '#fca5a5' }}>SEE</span>
                        </div>
                    </div>
                    <div
                        style={{
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 999,
                            padding: '3px 14px',
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#fee2e2',
                            background: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        BASIC MEMBER
                    </div>
                </div>
            </div>

            {/* Body */}
            <div
                style={{
                    position: 'absolute',
                    top: 96,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 32px',
                }}
            >
                {/* Watermark */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.03,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    <span
                        style={{
                            fontSize: 90,
                            fontWeight: 900,
                            fontStyle: 'italic',
                            transform: 'rotate(-12deg)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        ATTINSEE
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 28,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {/* Photo box */}
                    <div
                        style={{
                            width: 112,
                            height: 112,
                            flexShrink: 0,
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '5px solid #ffffff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {student.photo_url ? (
                            // eslint-disable-next-line jsx-a11y/img-redundant-alt
                            <img
                                src={student.photo_url}
                                crossOrigin="anonymous"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                alt=""
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: 34,
                                    fontWeight: 700,
                                    color: '#cbd5e1',
                                }}
                            >
                                {getInitials(student.name)}
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            paddingTop: 4,
                        }}
                    >
                        {/* Name */}
                        <div>
                            <div
                                style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Nama Lengkap
                            </div>
                            <div
                                style={{
                                    fontSize: 17,
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    textTransform: 'uppercase',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.2,
                                    marginTop: 1,
                                }}
                            >
                                {student.name || '—'}
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#991b1b',
                                    }}
                                >
                                    ID:
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'Courier New, monospace',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        color: '#334155',
                                    }}
                                >
                                    {formatId(student.id)}
                                </span>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                borderTop: '1px solid #f1f5f9',
                                borderBottom: '1px solid #f1f5f9',
                                padding: '6px 0',
                                gap: 8,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        color: '#94a3b8',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Kelas
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#1e293b',
                                        marginTop: 1,
                                    }}
                                >
                                    {student.class ?? '—'}
                                </div>
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        color: '#94a3b8',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Status
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#1e293b',
                                        marginTop: 1,
                                    }}
                                >
                                    Permanent
                                </div>
                            </div>
                        </div>

                        {/* School */}
                        <div>
                            <div
                                style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Sekolah
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#475569',
                                    marginTop: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {school.name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function StudentCards({ schools }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(
        null,
    );
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);

    // Hidden capture container — one card rendered here at a time
    const captureRef = useRef<HTMLDivElement>(null);

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

    const hasQuery = searchQuery.trim() !== '';
    const showResults = isSearchFocused && hasQuery;

    const helperText = !hasQuery
        ? 'Ketik untuk mencari sekolah.'
        : filteredSchools.length === 0
          ? `Tidak ada sekolah yang cocok dengan "${searchQuery}".`
          : `${filteredSchools.length} sekolah ditemukan.`;

    // ── Client-side PDF generation ─────────────────────────────────────────
    const downloadPdf = useCallback(async () => {
        if (!selectedSchool || generating) return;

        const students = selectedSchool.students;
        if (students.length === 0) return;

        setGenerating(true);
        setProgress({ done: 0, total: students.length });

        try {
            const { toPng } = await import('html-to-image');
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default ?? jsPDFModule.jsPDF;

            // PDF page size: A4 landscape = 297×210mm
            // Fit 2 cards per row, 3 rows per page = 6 cards/page
            const PAGE_W_MM = 297;
            const PAGE_H_MM = 210;
            const COLS = 2;
            const ROWS = 3;
            const PER_PAGE = COLS * ROWS;
            const MARGIN_MM = 8;
            const GAP_MM = 5;

            const cellW =
                (PAGE_W_MM - MARGIN_MM * 2 - GAP_MM * (COLS - 1)) / COLS;
            const cellH =
                (PAGE_H_MM - MARGIN_MM * 2 - GAP_MM * (ROWS - 1)) / ROWS;

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            for (let i = 0; i < students.length; i++) {
                const student = students[i];

                // --- Render card into hidden container ---
                const { createRoot } = await import('react-dom/client');
                const el = document.createElement('div');
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                el.style.top = '0';
                el.style.width = `${CARD_W}px`;
                el.style.height = `${CARD_H}px`;
                document.body.appendChild(el);

                let root: RootLike | null = null;
                await new Promise<void>((resolve) => {
                    root = createRoot(el);
                    root.render(
                        <AttinseeCard
                            student={student}
                            school={selectedSchool}
                        />,
                    );
                    // Give React + fonts a tick to paint
                    requestAnimationFrame(() =>
                        requestAnimationFrame(() => resolve()),
                    );
                });

                // --- Capture ---
                const dataUrl = await toPng(el.firstChild as HTMLElement, {
                    cacheBust: true,
                    pixelRatio: 2,
                    width: CARD_W,
                    height: CARD_H,
                    backgroundColor: '#ffffff',
                });

                // Cleanup
                if (root) root.unmount();
                document.body.removeChild(el);

                // --- Place on PDF page ---
                const posInPage = i % PER_PAGE;
                const col = posInPage % COLS;
                const row = Math.floor(posInPage / COLS);

                if (posInPage === 0 && i > 0) pdf.addPage();

                const x = MARGIN_MM + col * (cellW + GAP_MM);
                const y = MARGIN_MM + row * (cellH + GAP_MM);

                pdf.addImage(dataUrl, 'PNG', x, y, cellW, cellH);

                setProgress({ done: i + 1, total: students.length });

                // Yield to the browser every 10 cards to prevent UI freeze
                if ((i + 1) % 10 === 0) {
                    await new Promise((r) => setTimeout(r, 0));
                }
            }

            pdf.save(`kartu-siswa-${selectedSchool.name}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Gagal membuat PDF. Silakan coba lagi.');
        } finally {
            setGenerating(false);
            setProgress(null);
        }
    }, [selectedSchool, generating]);

    const progressPct = progress
        ? Math.round((progress.done / progress.total) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kartu Siswa" />

            {/* Hidden capture mount point (unused, we use dynamic el now) */}
            <div
                ref={captureRef}
                aria-hidden
                style={{ position: 'absolute', left: -9999 }}
            />

            <div className="flex h-full flex-1 flex-col px-4 py-6 lg:px-6">
                {/* Header */}
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Kartu Siswa
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Cari sekolah → pilih → download PDF kartu siswa.
                        </p>
                    </div>
                    {selectedSchool && (
                        <div className="rounded-lg border px-3 py-2 text-right text-xs sm:text-sm">
                            <div className="font-medium">
                                {selectedSchool.name}
                            </div>
                            <div className="text-muted-foreground">
                                {selectedSchool.students.length} siswa
                            </div>
                        </div>
                    )}
                </div>

                {/* Search + Download */}
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                    {/* Search */}
                    <div className="relative">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari sekolah… (contoh: SMA Negeri 1)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() =>
                                    window.setTimeout(
                                        () => setIsSearchFocused(false),
                                        120,
                                    )
                                }
                                className="h-10 pl-9"
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {helperText}
                        </p>

                        {showResults && (
                            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-background shadow-md">
                                {filteredSchools.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground">
                                        Tidak ada hasil.
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-auto">
                                        {filteredSchools.map((school) => (
                                            <button
                                                key={school.id}
                                                type="button"
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                onClick={() => {
                                                    setSelectedSchoolId(
                                                        school.id,
                                                    );
                                                    setIsSearchFocused(false);
                                                }}
                                                className={cn(
                                                    'flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition',
                                                    school.id ===
                                                        selectedSchoolId
                                                        ? 'bg-muted'
                                                        : 'hover:bg-muted/70',
                                                )}
                                            >
                                                <div className="min-w-0">
                                                    <div className="line-clamp-1 font-medium">
                                                        {school.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {school.students.length}{' '}
                                                        siswa
                                                    </div>
                                                </div>
                                                {school.id ===
                                                    selectedSchoolId && (
                                                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                                                        Dipilih
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Download button */}
                    <div className="flex flex-col gap-2 md:min-w-[240px]">
                        <Button
                            onClick={downloadPdf}
                            disabled={!selectedSchool || generating}
                            className="h-10 w-full"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                    Membuat PDF…
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    {selectedSchool
                                        ? `Download PDF (${selectedSchool.students.length} siswa)`
                                        : 'Pilih sekolah dulu'}
                                </>
                            )}
                        </Button>

                        {/* Progress bar */}
                        {generating && progress && (
                            <div className="space-y-1">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all duration-200"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <p className="text-center text-xs text-muted-foreground">
                                    {progress.done} / {progress.total} kartu
                                    diproses ({progressPct}%)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview grid */}
                <Card className="flex flex-1 flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center justify-between gap-2">
                            <span>Preview Kartu</span>
                            {selectedSchool && (
                                <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {selectedSchool.name}
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Preview kartu siswa dalam desain ATTINSEE terbaru.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 pt-4">
                        {!selectedSchool ? (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                Pilih sekolah untuk melihat preview kartu.
                            </div>
                        ) : selectedSchool.students.length === 0 ? (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                Tidak ada siswa terdaftar di sekolah ini.
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {selectedSchool.students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="overflow-hidden rounded-xl border shadow-sm"
                                        style={{ aspectRatio: '1.58/1' }}
                                    >
                                        {/* Scaled-down preview — CSS transform for performance */}
                                        <div
                                            style={{
                                                transform: `scale(${320 / CARD_W})`,
                                                transformOrigin: 'top left',
                                                width: CARD_W,
                                                height: CARD_H,
                                            }}
                                        >
                                            <AttinseeCard
                                                student={student}
                                                school={selectedSchool}
                                            />
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
