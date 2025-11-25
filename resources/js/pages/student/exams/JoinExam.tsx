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
import { useState } from 'react';

interface University {
    id: number;
    name: string;
    majors: Array<{
        id: number;
        name: string;
    }>;
}

interface Props {
    universities: University[];
}

export default function JoinExam({ universities }: Props) {
    const [selectedUniversityId, setSelectedUniversityId] =
        useState<string>('');
    const { data, setData, post, processing, errors } = useForm({
        token: '',
        university_id: '',
        major_id: '',
    });

    const selectedUniversity = universities.find(
        (u) => u.id === parseInt(selectedUniversityId),
    );
    const majors = selectedUniversity?.majors || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student/exams/start');
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Masuk Ujian" />
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-3xl font-bold">
                            Masuk Ujian
                        </CardTitle>
                        <CardDescription>
                            Masukkan token ujian Anda dan pilih universitas Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            {/* University Select */}
                            <div className="space-y-2">
                                <Label htmlFor="university">
                                    Universitas *
                                </Label>
                                <Select
                                    value={selectedUniversityId}
                                    onValueChange={(value) => {
                                        setSelectedUniversityId(value);
                                        setData({
                                            ...data,
                                            university_id: value,
                                            major_id: '',
                                        });
                                    }}
                                >
                                    <SelectTrigger
                                        id="university"
                                        className={
                                            errors.university_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Pilih universitas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {universities.map((uni) => (
                                            <SelectItem
                                                key={uni.id}
                                                value={uni.id.toString()}
                                            >
                                                {uni.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.university_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.university_id}
                                    </p>
                                )}
                            </div>

                            {/* Major Select */}
                            <div className="space-y-2">
                                <Label htmlFor="major">Jurusan *</Label>
                                <Select
                                    value={data.major_id}
                                    onValueChange={(value) =>
                                        setData('major_id', value)
                                    }
                                    disabled={!selectedUniversityId}
                                >
                                    <SelectTrigger
                                        id="major"
                                        className={
                                            errors.major_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue
                                            placeholder={
                                                selectedUniversityId
                                                    ? 'Pilih jurusan'
                                                    : 'Pilih universitas terlebih dahulu'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {majors.map((major) => (
                                            <SelectItem
                                                key={major.id}
                                                value={major.id.toString()}
                                            >
                                                {major.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.major_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.major_id}
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
