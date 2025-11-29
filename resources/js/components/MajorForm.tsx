import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type UniversityOption = {
    id: number;
    name: string;
};

type MajorFormProps = {
    universities: UniversityOption[];
    onCreated?: () => void;
};

export function MajorForm({ universities, onCreated }: MajorFormProps) {
    const [universityId, setUniversityId] = useState<string>('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minimumPassingGrade, setMinimumPassingGrade] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!universityId) {
            setErrors(['Harap pilih universitas.']);
            return;
        }

        if (!minimumPassingGrade) {
            setErrors(['Harap isi nilai kelulusan minimum.']);
            return;
        }

        setSubmitting(true);
        setErrors([]);
        setMessage(null);

        try {
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';

            const payload = {
                university_id: Number(universityId),
                name,
                description: description || null,
                minimum_passing_grade: Number(minimumPassingGrade),
            };

            console.log('Submitting payload:', payload);

            const response = await fetch('/admin/majors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 422) {
                const data = await response.json();
                const validationErrors: string[] = [];

                if (data.errors) {
                    Object.values<string[]>(data.errors).forEach(
                        (fieldErrors) => {
                            validationErrors.push(...fieldErrors);
                        },
                    );
                }

                setErrors(validationErrors);
                setMessage({
                    type: 'error',
                    text: 'Harap perbaiki kesalahan di bawah.',
                });
            } else if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Jurusan berhasil dibuat.',
                });
                setName('');
                setDescription('');
                setUniversityId('');
                setMinimumPassingGrade('');
                setErrors([]);
                onCreated?.();
            } else {
                setMessage({
                    type: 'error',
                    text: 'Gagal membuat jurusan.',
                });
            }
        } catch (_error) {
            console.error(_error);
            setMessage({
                type: 'error',
                text: 'Terjadi kesalahan tak terduga saat membuat jurusan.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Buat Jurusan</CardTitle>
            </CardHeader>
            <CardContent>
                {message && (
                    <div
                        className={`mb-3 text-sm ${
                            message.type === 'success'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {errors.length > 0 && (
                    <ul className="mb-3 list-disc pl-5 text-sm text-red-600">
                        {errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Universitas <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={universityId}
                            onValueChange={(v) => setUniversityId(v)}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        universities.length === 0
                                            ? 'Tidak ada universitas tersedia'
                                            : 'Pilih universitas'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {universities.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Nama Jurusan <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Teknik Informatika"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Nilai Passing Grade{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            value={minimumPassingGrade}
                            onChange={(e) =>
                                setMinimumPassingGrade(e.target.value)
                            }
                            required
                            placeholder="75"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Deskripsi
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? 'Menyimpan...' : 'Simpan Jurusan'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
