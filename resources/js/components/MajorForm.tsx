// resources/js/components/admin/universities/MajorForm.tsx

import { FormEvent, useEffect, useState } from 'react';

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
    onCreated?: () => void;
};

export function MajorForm({ onCreated }: MajorFormProps) {
    const [universities, setUniversities] = useState<UniversityOption[]>([]);
    const [universitiesLoading, setUniversitiesLoading] = useState(true);

    const [universityId, setUniversityId] = useState<string>('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // 1) Fetch all universities once when component mounts
    useEffect(() => {
        const loadUniversities = async () => {
            try {
                const res = await fetch('/admin/universities/options', {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!res.ok) {
                    throw new Error('Failed to load universities');
                }

                const data: UniversityOption[] = await res.json();
                setUniversities(data);
                console.log('Loaded universities:', data);
            } catch (error) {
                console.error(error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load universities.',
                });
            } finally {
                setUniversitiesLoading(false);
            }
        };

        loadUniversities();
    }, []);

    // 2) Handle submit, sending university_id + other fields
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!universityId) {
            setErrors(['Please select a university.']);
            return;
        }

        setSubmitting(true);
        setErrors([]);
        setMessage(null);

        try {
            // Get CSRF token from <meta> tag to avoid 419
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';

            const response = await fetch('/admin/majors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    university_id: Number(universityId),
                    name,
                    description: description || null,
                }),
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
                            onValueChange={(v) => {
                                console.log('changed to:', v);
                                setUniversityId(v);
                            }}
                            disabled={universitiesLoading}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        universitiesLoading
                                            ? 'Loading...'
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
