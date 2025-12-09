import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';

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
    university_id: string; // will be university.id as string
    majors: string[]; // major ids as strings
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

    const selections = data.selections;

    // Helpers
    const totalMajorsSelected = selections.reduce(
        (sum, sel) => sum + sel.majors.length,
        0,
    );

    const canAddUniversity = selections.length < 2;

    const getUniversityById = (id: string) =>
        universities.find((u) => u.id === Number(id));

    const updateSelections = (next: Selection[]) => {
        setData('selections', next);
    };

    const handleUniversityChange = (index: number, universityId: string) => {
        const next = [...selections];
        next[index] = {
            university_id: universityId,
            majors: [], // reset majors when university changes
        };
        updateSelections(next);
    };

    const handleMajorToggle = (index: number, majorId: string) => {
        const next = [...selections];
        const majors = next[index].majors;

        const isSelected = majors.includes(majorId);

        if (isSelected) {
            // uncheck → always allowed
            next[index].majors = majors.filter((m) => m !== majorId);
            updateSelections(next);
            return;
        }

        // check → enforce global max 4 majors
        if (totalMajorsSelected >= 4) {
            // optional UX, backend also enforces this
            alert('Maksimal 4 jurusan dapat dipilih.');
            return;
        }

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Light frontend validation (backend will still validate)
        if (selections.some((s) => !s.university_id || s.majors.length === 0)) {
            alert('Lengkapi pilihan universitas dan jurusan Anda.');
            return;
        }

        post('/student/exams/start');
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Masuk Ujian" />
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-2xl shadow-2xl">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-3xl font-bold">
                            Masuk Ujian
                        </CardTitle>
                        <CardDescription>
                            Masukkan token ujian dan pilih hingga{' '}
                            <span className="font-semibold">2 universitas</span>{' '}
                            dengan maksimal{' '}
                            <span className="font-semibold">4 jurusan</span>{' '}
                            secara keseluruhan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Exam Info */}
                            {exam && (
                                <Alert className="border-blue-200 bg-blue-50">
                                    <AlertDescription className="space-y-2">
                                        <div>
                                            <strong>Ujian:</strong> {exam.name}
                                        </div>
                                        <div>
                                            <strong>Durasi:</strong>{' '}
                                            {exam.settings
                                                ?.time_limit_minutes || 90}{' '}
                                            menit
                                        </div>
                                        <div>
                                            <strong>Dimulai:</strong>{' '}
                                            {new Date(
                                                exam.start_at,
                                            ).toLocaleString()}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Token Input */}
                            <div className="space-y-2">
                                <Label htmlFor="token">Token Ujian *</Label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="Masukkan token ujian"
                                    value={data.token}
                                    onChange={(e) =>
                                        setData('token', e.target.value)
                                    }
                                    className={
                                        errors.token ? 'border-red-500' : ''
                                    }
                                />
                                {errors.token && (
                                    <p className="text-sm text-red-500">
                                        {errors.token}
                                    </p>
                                )}
                            </div>

                            {/* University & Major Selections */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>
                                        Pilih Universitas &amp; Jurusan *
                                    </Label>
                                    <span className="text-sm text-gray-500">
                                        {totalMajorsSelected}/4 jurusan dipilih
                                    </span>
                                </div>

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
                                        <div
                                            key={index}
                                            className="space-y-3 rounded-lg border p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold">
                                                    Pilihan {index + 1}
                                                </h3>
                                                {selections.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveUniversity(
                                                                index,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* University Select */}
                                            <div className="space-y-2">
                                                <Label>Universitas *</Label>
                                                <div
                                                    className={
                                                        universityError
                                                            ? 'rounded-md border-red-500'
                                                            : ''
                                                    }
                                                >
                                                    <Select
                                                        value={
                                                            selection.university_id
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleUniversityChange(
                                                                index,
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih universitas" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {universities.map(
                                                                (uni) => (
                                                                    <SelectItem
                                                                        key={
                                                                            uni.id
                                                                        }
                                                                        value={uni.id.toString()}
                                                                    >
                                                                        {
                                                                            uni.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {universityError && (
                                                    <p className="text-sm text-red-500">
                                                        {universityError}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Major Checkboxes */}
                                            {selectedUni && (
                                                <div className="space-y-2">
                                                    <Label>
                                                        Jurusan * (max 4 total)
                                                    </Label>
                                                    <div className="space-y-2">
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
                                                                    <div
                                                                        key={
                                                                            major.id
                                                                        }
                                                                        className="flex items-center"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`major-${index}-${major.id}`}
                                                                            checked={
                                                                                isChecked
                                                                            }
                                                                            disabled={
                                                                                disabled
                                                                            }
                                                                            onChange={() =>
                                                                                handleMajorToggle(
                                                                                    index,
                                                                                    majorId,
                                                                                )
                                                                            }
                                                                            className="h-4 w-4 rounded border-gray-300"
                                                                        />
                                                                        <label
                                                                            htmlFor={`major-${index}-${major.id}`}
                                                                            className="ml-2 flex-1 cursor-pointer text-sm"
                                                                        >
                                                                            {
                                                                                major.name
                                                                            }
                                                                        </label>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
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
                                    <button
                                        type="button"
                                        onClick={handleAddUniversity}
                                        className="flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 py-2 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Universitas
                                    </button>
                                )}

                                {/* Global selections error (e.g. “Maximum 4 majors can be selected”) */}
                                {errors.selections && (
                                    <p className="text-sm text-red-500">
                                        {errors.selections as string}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                            >
                                {processing
                                    ? 'Memulai Ujian...'
                                    : 'Mulai Ujian'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
