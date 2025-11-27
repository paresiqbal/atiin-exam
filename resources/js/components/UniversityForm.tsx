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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

interface UniversityFormProps {
    onCreated?: () => void;
    title?: string;
    description?: string;
    className?: string;
}

export function UniversityForm({
    onCreated,
    title = 'Tambah Universitas',
    description = 'Tambahkan universitas baru dengan kode, kota, dan website (opsional).',
    className,
}: UniversityFormProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        city: '',
        description: '',
        website: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/admin/universities', {
            onSuccess: () => {
                reset();
                if (onCreated) onCreated();
            },
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                        <Label htmlFor="name">
                            Nama Universitas{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: Universitas Indonesia"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Code & City in one row */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <Label htmlFor="code">Kode (opsional)</Label>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
                                placeholder="Contoh: UI, ITB, UGM"
                            />
                            {errors.code && (
                                <p className="text-sm text-red-500">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="city">Kota (opsional)</Label>
                            <Input
                                id="city"
                                value={data.city}
                                onChange={(e) =>
                                    setData('city', e.target.value)
                                }
                                placeholder="Contoh: Depok, Bandung, Yogyakarta"
                            />
                            {errors.city && (
                                <p className="text-sm text-red-500">
                                    {errors.city}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Website */}
                    <div className="space-y-1">
                        <Label htmlFor="website">Website (opsional)</Label>
                        <Input
                            id="website"
                            type="url"
                            value={data.website}
                            onChange={(e) => setData('website', e.target.value)}
                            placeholder="https://contoh.ac.id"
                        />
                        {errors.website && (
                            <p className="text-sm text-red-500">
                                {errors.website}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <Label htmlFor="description">
                            Deskripsi (opsional)
                        </Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Deskripsi singkat tentang universitas..."
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            'Simpan Universitas'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
