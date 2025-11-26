// resources/js/components/admin/universities/UniversityForm.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent, useState } from 'react';

type UniversityFormProps = {
    onCreated?: () => void;
};

export function UniversityForm({ onCreated }: UniversityFormProps) {
    const [name, setName] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors([]);
        setMessage(null);

        try {
            const response = await fetch('/admin/universities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name,
                    website: website || null,
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
                    text: 'University created successfully.',
                });
                setName('');
                setWebsite('');
                setDescription('');
                setErrors([]);
                onCreated?.();
            } else {
                setMessage({
                    type: 'error',
                    text: 'Failed to create university.',
                });
            }
        } catch (_error) {
            console.error(_error);
            setMessage({
                type: 'error',
                text: 'Unexpected error while creating university.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Single University</CardTitle>
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
                            Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Universitas Contoh"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Website
                        </label>
                        <Input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://example.ac.id"
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
                        {submitting ? 'Saving...' : 'Save University'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
