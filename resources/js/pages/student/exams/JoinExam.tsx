import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    Check,
    ClipboardPaste,
    GraduationCap,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Major {
    id: number;
    name: string;
}

interface University {
    id: number;
    name: string;
    majors: Major[];
}

interface Exam {
    id: number;
    name: string;
    description: string;
    start_at: string;
    end_at: string;
    settings: {
        time_limit_minutes: number;
    };
}

interface Props {
    universities: University[];
    exam?: Exam;
}

interface Selection {
    university_id: string;
    majors: string[];
}

interface FormData {
    token: string;
    selections: Selection[];
}

export default function JoinExam({ universities, exam }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        token: '',
        selections: [
            {
                university_id: '',
                majors: [],
            },
        ],
    });

    const [openUniversityDialog, setOpenUniversityDialog] = useState(false);
    const [currentSelectionIndex, setCurrentSelectionIndex] = useState<
        number | null
    >(null);
    const [universitySearch, setUniversitySearch] = useState('');
    const [pasteFeedback, setPasteFeedback] = useState(false);

    const selections = data.selections;

    // Helpers
    const totalMajorsSelected = selections.reduce(
        (sum, sel) => sum + sel.majors.length,
        0,
    );

    // Max 3 universities
    const canAddUniversity = selections.length < 3;

    const getUniversityById = (id: string) =>
        universities.find((u) => u.id === Number(id));

    // Filter universities by search
    const filteredUniversities = useMemo(() => {
        const query = universitySearch.toLowerCase().trim();
        if (!query) return universities;
        return universities.filter((uni) =>
            uni.name.toLowerCase().includes(query),
        );
    }, [universities, universitySearch]);

    const updateSelections = (next: Selection[]) => {
        setData('selections', next);
    };

    const handleUniversityChange = (index: number, universityId: string) => {
        const next = [...selections];
        next[index] = {
            university_id: universityId,
            majors: [],
        };
        updateSelections(next);
        setOpenUniversityDialog(false);
        setUniversitySearch('');
    };

    const handleOpenUniversityDialog = (index: number) => {
        setCurrentSelectionIndex(index);
        setOpenUniversityDialog(true);
    };

    const handleMajorToggle = (index: number, majorId: string) => {
        const next = [...selections];
        const majors = next[index].majors;

        const isSelected = majors.includes(majorId);

        if (isSelected) {
            next[index].majors = majors.filter((m) => m !== majorId);
            updateSelections(next);
            return;
        }

        // Max 4 majors overall
        if (totalMajorsSelected >= 4) return;

        next[index].majors = [...majors, majorId];
        updateSelections(next);
    };

    const handleAddUniversity = () => {
        if (!canAddUniversity) return;
        updateSelections([...selections, { university_id: '', majors: [] }]);
    };

    const handleRemoveUniversity = (index: number) => {
        const next = selections.filter((_, i) => i !== index);
        updateSelections(
            next.length ? next : [{ university_id: '', majors: [] }],
        );
    };

    const handlePasteToken = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setData('token', text.trim());
            setPasteFeedback(true);
            setTimeout(() => setPasteFeedback(false), 2000);
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    };

    const handleSubmit = () => {
        if (selections.some((s) => !s.university_id || s.majors.length === 0)) {
            return;
        }

        post('/student/exams/start');
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Masuk Ujian" />

            {/* Neutral background + tighter padding */}
            <div className="min-h-screen bg-background p-4 md:p-6">
                <div className="mx-auto max-w-3xl space-y-4">
                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <GraduationCap className="h-7 w-7 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                            Masuk Ujian
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            Masukkan token ujian dan pilih hingga{' '}
                            <span className="font-semibold text-foreground">
                                3 universitas
                            </span>{' '}
                            dengan maksimal{' '}
                            <span className="font-semibold text-foreground">
                                4 jurusan
                            </span>{' '}
                            secara keseluruhan
                        </p>
                    </div>

                    {/* Exam Info - clearer + neutral (no blue-ish bg) */}
                    {exam && (
                        <Alert className="rounded-2xl border-border bg-card">
                            <AlertDescription className="text-sm">
                                <div className="grid gap-2 md:grid-cols-3">
                                    <div className="space-y-0.5">
                                        <div className="text-xs text-muted-foreground">
                                            Ujian
                                        </div>
                                        <div className="font-medium text-foreground">
                                            {exam.name}
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <div className="text-xs text-muted-foreground">
                                            Durasi
                                        </div>
                                        <div className="font-medium text-foreground">
                                            {exam.settings
                                                ?.time_limit_minutes || 90}{' '}
                                            menit
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <div className="text-xs text-muted-foreground">
                                            Mulai
                                        </div>
                                        <div className="font-medium text-foreground">
                                            {new Date(
                                                exam.start_at,
                                            ).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {/* Token Input Card */}
                        <Card className="rounded-2xl border">
                            <CardContent className="pt-5">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="token"
                                        className="text-base font-semibold"
                                    >
                                        Token Ujian
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="token"
                                            type="text"
                                            placeholder="Masukkan atau paste token ujian"
                                            value={data.token}
                                            onChange={(e) =>
                                                setData('token', e.target.value)
                                            }
                                            className={`h-11 rounded-xl pr-24 text-base ${
                                                errors.token
                                                    ? 'border-red-500'
                                                    : ''
                                            }`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePasteToken}
                                            className="absolute top-1/2 right-2 -translate-y-1/2 gap-2"
                                        >
                                            {pasteFeedback ? (
                                                <>
                                                    <Check className="h-4 w-4 text-green-600" />
                                                    <span className="text-green-600">
                                                        Paste!
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardPaste className="h-4 w-4" />
                                                    Paste
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    {errors.token && (
                                        <p className="text-sm text-red-500">
                                            {errors.token}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* University & Major Selections Card */}
                        <Card className="rounded-2xl border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            Pilih Universitas & Jurusan
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Pilih program studi yang ingin Anda
                                            daftar
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {totalMajorsSelected}/4
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Jurusan
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {selections.map((selection, index) => {
                                    const selectedUni = getUniversityById(
                                        selection.university_id,
                                    );

                                    const universityError =
                                        (errors[
                                            `selections.${index}.university_id`
                                        ] as string) || '';
                                    const majorsError =
                                        (errors[
                                            `selections.${index}.majors`
                                        ] as string) || '';

                                    return (
                                        // Not a "card in card": flatter section
                                        <div
                                            key={index}
                                            className="space-y-4 rounded-xl border p-4"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="text-base font-semibold">
                                                        Pilihan {index + 1}
                                                    </h3>
                                                </div>

                                                {selections.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRemoveUniversity(
                                                                index,
                                                            )
                                                        }
                                                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* University Selection */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">
                                                    Universitas
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleOpenUniversityDialog(
                                                            index,
                                                        )
                                                    }
                                                    className={`h-11 w-full justify-start rounded-xl text-left font-normal ${
                                                        universityError
                                                            ? 'border-red-500'
                                                            : ''
                                                    }`}
                                                >
                                                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                                                    <span className="truncate">
                                                        {selectedUni
                                                            ? selectedUni.name
                                                            : 'Pilih universitas'}
                                                    </span>
                                                </Button>
                                                {universityError && (
                                                    <p className="text-sm text-red-500">
                                                        {universityError}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Major Checkboxes */}
                                            {selectedUni && (
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium">
                                                        Jurusan (Pilih minimal
                                                        1)
                                                    </Label>

                                                    {selectedUni.majors.length >
                                                    0 ? (
                                                        <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                                                            {selectedUni.majors.map(
                                                                (major) => {
                                                                    const majorId =
                                                                        major.id.toString();
                                                                    const isChecked =
                                                                        selection.majors.includes(
                                                                            majorId,
                                                                        );
                                                                    const disabled =
                                                                        !isChecked &&
                                                                        totalMajorsSelected >=
                                                                            4;

                                                                    return (
                                                                        <label
                                                                            key={
                                                                                major.id
                                                                            }
                                                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                                                                isChecked
                                                                                    ? 'border-primary bg-primary/5'
                                                                                    : disabled
                                                                                      ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
                                                                                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                                                            }`}
                                                                        >
                                                                            <Checkbox
                                                                                checked={
                                                                                    isChecked
                                                                                }
                                                                                disabled={
                                                                                    disabled
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    handleMajorToggle(
                                                                                        index,
                                                                                        majorId,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="flex-1 text-sm font-medium">
                                                                                {
                                                                                    major.name
                                                                                }
                                                                            </span>
                                                                            {isChecked && (
                                                                                <Check className="h-4 w-4 text-primary" />
                                                                            )}
                                                                        </label>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="py-4 text-center text-sm text-muted-foreground">
                                                            Tidak ada jurusan
                                                            tersedia
                                                        </p>
                                                    )}

                                                    {majorsError && (
                                                        <p className="text-sm text-red-500">
                                                            {majorsError}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Add Another University Button */}
                                {canAddUniversity && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddUniversity}
                                        className="h-11 w-full gap-2 rounded-xl border border-dashed"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Universitas (Pilihan{' '}
                                        {selections.length + 1})
                                    </Button>
                                )}

                                {/* Global selections error */}
                                {errors.selections && (
                                    <p className="text-center text-sm text-red-500">
                                        {errors.selections as string}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="h-12 w-full rounded-xl text-base"
                            size="lg"
                        >
                            {processing ? 'Memulai Ujian...' : 'Mulai Ujian'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* University Search Dialog */}
            <Dialog
                open={openUniversityDialog}
                onOpenChange={setOpenUniversityDialog}
            >
                <DialogContent className="max-h-[80vh] max-w-2xl rounded-2xl p-0">
                    <DialogHeader className="border-b px-6 pt-6 pb-4">
                        <DialogTitle>Pilih Universitas</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 py-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari universitas..."
                                value={universitySearch}
                                onChange={(e) =>
                                    setUniversitySearch(e.target.value)
                                }
                                className="h-11 rounded-xl pl-9"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* University List */}
                    <div className="max-h-[50vh] overflow-y-auto px-6 pb-6">
                        {filteredUniversities.length > 0 ? (
                            <div className="space-y-2">
                                {filteredUniversities.map((uni) => (
                                    <button
                                        key={uni.id}
                                        type="button"
                                        onClick={() =>
                                            currentSelectionIndex !== null &&
                                            handleUniversityChange(
                                                currentSelectionIndex,
                                                uni.id.toString(),
                                            )
                                        }
                                        className="w-full rounded-xl border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium">
                                                    {uni.name}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {uni.majors.length} program
                                                    studi
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                                <p className="mt-4 font-semibold text-foreground">
                                    Tidak ada universitas ditemukan
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Coba kata kunci lain
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
