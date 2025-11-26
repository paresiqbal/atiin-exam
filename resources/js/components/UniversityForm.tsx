// UniversityForm.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';

type UniversityFormProps = {
    onCreated?: () => void;
};

export function UniversityForm({ onCreated }: UniversityFormProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        website: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/admin/universities', {
            onSuccess: () => {
                reset();
                onCreated?.();
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Single University</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Show validation errors from Laravel */}
                {Object.values(errors).length > 0 && (
                    <ul className="mb-3 list-disc pl-5 text-sm text-red-600">
                        {Object.values(errors).map((err, idx) => (
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
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
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
                            value={data.website}
                            onChange={(e) => setData('website', e.target.value)}
                            placeholder="https://example.ac.id"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving...' : 'Save University'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
