import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    FileText,
    Layers,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Stats {
    users: { total: number; students: number; admins: number };
    exams: {
        total: number;
        published: number;
        draft: number;
        irt_processed: number;
    };
    attempts: {
        total: number;
        completed: number;
        in_progress: number;
        frozen: number;
        passed: number;
        failed: number;
    };
    questions: { total: number; banks: number };
    avg_skor_utbk: number;
}

interface RecentAttempt {
    id: number;
    student_name: string;
    exam_name: string;
    skor_utbk_pct: number | null;
    irt_processed: boolean;
    passed: boolean;
    completed_at: string;
}

interface ExamPerf {
    name: string;
    total_attempts: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_skor_utbk: number | null;
    irt_processed: boolean;
}

interface SkorBucket {
    range: string;
    count: number;
}

interface Props {
    statistics: Stats;
    recent_attempts: RecentAttempt[];
    exam_performance: ExamPerf[];
    skor_distribution: SkorBucket[];
}

// ── Palette ──────────────────────────────────────────────────────────────────
const GREEN = '#16a34a';
const RED = '#dc2626';
const SLATE = '#64748b';
const BLUE = '#2563eb';
const AMBER = '#d97706';

// ── Small stat card ──────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    accent: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-5">
            <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="text-2xl font-bold">{value}</p>
                {sub && (
                    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                )}
            </div>
            <div
                className="mt-0.5 shrink-0 rounded-lg p-2"
                style={{ backgroundColor: accent + '18' }}
            >
                <Icon className="h-5 w-5" style={{ color: accent }} />
            </div>
        </div>
    );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {children}
        </p>
    );
}

// ── Custom tooltip for charts ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
            {label && <p className="mb-1 font-semibold">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.fill || p.color }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard({
    statistics: s,
    recent_attempts,
    exam_performance,
    skor_distribution,
}: Props) {
    const passRate =
        s.attempts.completed > 0
            ? ((s.attempts.passed / s.attempts.completed) * 100).toFixed(1)
            : '0';

    const passFailData = [
        { name: 'Lulus', value: s.attempts.passed, fill: GREEN },
        { name: 'Tidak Lulus', value: s.attempts.failed, fill: RED },
    ];

    const irtData = [
        { name: 'Sudah IRT', value: s.exams.irt_processed, fill: BLUE },
        {
            name: 'Belum IRT',
            value: s.exams.total - s.exams.irt_processed,
            fill: SLATE,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />

            <div className="flex flex-1 flex-col gap-6 p-5">
                {/* ── Top stat cards ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Total Siswa"
                        value={s.users.students}
                        sub={`${s.users.admins} admin`}
                        icon={Users}
                        accent={BLUE}
                    />
                    <StatCard
                        label="Total Ujian"
                        value={s.exams.total}
                        sub={`${s.exams.published} dipublikasi · ${s.exams.draft} draft`}
                        icon={FileText}
                        accent={AMBER}
                    />
                    <StatCard
                        label="Percobaan Selesai"
                        value={s.attempts.completed}
                        sub={`${s.attempts.in_progress} sedang berlangsung · ${s.attempts.frozen} dibekukan`}
                        icon={Zap}
                        accent={SLATE}
                    />
                    <StatCard
                        label="Rata-rata Skor UTBK"
                        value={
                            s.avg_skor_utbk > 0
                                ? `${s.avg_skor_utbk.toFixed(2)}%`
                                : '-'
                        }
                        sub={`${passRate}% tingkat kelulusan`}
                        icon={BookOpen}
                        accent={GREEN}
                    />
                </div>

                {/* ── Secondary stats row ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="IRT Diproses"
                        value={s.exams.irt_processed}
                        sub={`dari ${s.exams.total} ujian`}
                        icon={Layers}
                        accent={BLUE}
                    />
                    <StatCard
                        label="Total Soal"
                        value={s.questions.total}
                        sub={`${s.questions.banks} bank soal`}
                        icon={BookOpen}
                        accent={AMBER}
                    />
                    <StatCard
                        label="Lulus"
                        value={s.attempts.passed}
                        sub="dari percobaan selesai"
                        icon={CheckCircle2}
                        accent={GREEN}
                    />
                    <StatCard
                        label="Tidak Lulus"
                        value={s.attempts.failed}
                        sub="dari percobaan selesai"
                        icon={XCircle}
                        accent={RED}
                    />
                </div>

                {/* ── Charts row ── */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Pass/Fail pie */}
                    <div className="rounded-xl border bg-card p-5">
                        <SectionTitle>Distribusi Kelulusan</SectionTitle>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={passFailData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {passFailData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 flex justify-center gap-5 text-xs">
                            {passFailData.map((d) => (
                                <div
                                    key={d.name}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                        style={{ background: d.fill }}
                                    />
                                    <span className="text-muted-foreground">
                                        {d.name}
                                    </span>
                                    <span className="font-semibold">
                                        {d.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IRT processed pie */}
                    <div className="rounded-xl border bg-card p-5">
                        <SectionTitle>Status IRT Ujian</SectionTitle>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={irtData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {irtData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 flex justify-center gap-5 text-xs">
                            {irtData.map((d) => (
                                <div
                                    key={d.name}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                        style={{ background: d.fill }}
                                    />
                                    <span className="text-muted-foreground">
                                        {d.name}
                                    </span>
                                    <span className="font-semibold">
                                        {d.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skor UTBK distribution histogram */}
                    <div className="rounded-xl border bg-card p-5">
                        <SectionTitle>Distribusi Skor UTBK</SectionTitle>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={skor_distribution} barSize={28}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="range"
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="count"
                                    name="Siswa"
                                    fill={BLUE}
                                    radius={[3, 3, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Exam performance bar ── */}
                <div className="rounded-xl border bg-card p-5">
                    <SectionTitle>Pass Rate per Ujian (5 Terbaru)</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={exam_performance} barSize={32}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={55}
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                domain={[0, 100]}
                                unit="%"
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="pass_rate"
                                name="Pass Rate"
                                radius={[3, 3, 0, 0]}
                            >
                                {exam_performance.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={
                                            entry.pass_rate >= 60
                                                ? GREEN
                                                : entry.pass_rate >= 40
                                                  ? AMBER
                                                  : RED
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Bottom: recent attempts + exam table ── */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent attempts */}
                    <div className="rounded-xl border bg-card p-5">
                        <SectionTitle>Percobaan Terbaru</SectionTitle>
                        <div className="space-y-0 divide-y">
                            {recent_attempts.map((a) => (
                                <Link
                                    key={a.id}
                                    href={`/admin/attempts/${a.id}`}
                                    className="-mx-1 flex items-center justify-between gap-3 rounded px-1 py-3 transition-colors hover:bg-muted/40"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {a.student_name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {a.exam_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {a.completed_at}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        {a.irt_processed ? (
                                            <p className="text-sm font-bold">
                                                {a.skor_utbk_pct?.toFixed(2)}%
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Belum IRT
                                            </p>
                                        )}
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                                            style={{
                                                background: a.passed
                                                    ? GREEN + '18'
                                                    : RED + '18',
                                                color: a.passed ? GREEN : RED,
                                            }}
                                        >
                                            {a.passed ? 'Lulus' : 'Tidak Lulus'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Exam summary table */}
                    <div className="rounded-xl border bg-card p-5">
                        <SectionTitle>Ringkasan Ujian</SectionTitle>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 text-left font-semibold text-muted-foreground">
                                            Ujian
                                        </th>
                                        <th className="py-2 text-right font-semibold text-muted-foreground">
                                            Peserta
                                        </th>
                                        <th className="py-2 text-right font-semibold text-muted-foreground">
                                            Pass Rate
                                        </th>
                                        <th className="py-2 text-right font-semibold text-muted-foreground">
                                            Avg Skor
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {exam_performance.map((e, i) => (
                                        <tr
                                            key={i}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="max-w-[140px] py-2.5 pr-2">
                                                <span className="block truncate">
                                                    {e.name}
                                                </span>
                                                {e.irt_processed && (
                                                    <span
                                                        className="text-[10px] font-medium"
                                                        style={{ color: BLUE }}
                                                    >
                                                        IRT ✓
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 text-right">
                                                {e.total_attempts}
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <span
                                                    className="font-semibold"
                                                    style={{
                                                        color:
                                                            e.pass_rate >= 60
                                                                ? GREEN
                                                                : e.pass_rate >=
                                                                    40
                                                                  ? AMBER
                                                                  : RED,
                                                    }}
                                                >
                                                    {e.pass_rate}%
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right text-muted-foreground">
                                                {e.avg_skor_utbk !== null
                                                    ? `${e.avg_skor_utbk}%`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
