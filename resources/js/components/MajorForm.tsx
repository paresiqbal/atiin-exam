// resources/js/components/admin/universities/MajorForm.tsx
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
    universities: UniversityOption[]; // ✅ passed from parent
    onCreated?: () => void;
};

export function MajorForm({ universities, onCreated }: MajorFormProps) {
    console.log('MajorForm universities:', universities);
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
            setErrors(['Please select a university.']);
            return;
        }

        if (!minimumPassingGrade) {
            setErrors(['Please fill minimum passing grade.']);
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
                    text: 'Please fix the errors below.',
                });
            } else if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Major created successfully.',
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
                    text: 'Failed to create major.',
                });
            }
        } catch (_error) {
            console.error(_error);
            setMessage({
                type: 'error',
                text: 'Unexpected error while creating major.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Single Major</CardTitle>
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
                            University <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={universityId}
                            onValueChange={(v) => setUniversityId(v)}
                            // disabled={universities.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        universities.length === 0
                                            ? 'No universities available'
                                            : 'Choose university'
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
                            Major Name <span className="text-red-500">*</span>
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
                            Minimum Passing Grade{' '}
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
                            Description
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Major'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
