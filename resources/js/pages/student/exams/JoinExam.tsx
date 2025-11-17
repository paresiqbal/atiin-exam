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
            <Head title="Join Exam" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                <Card className="w-full max-w-md bg-white shadow-2xl">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-3xl font-bold">
                            Join Exam
                        </CardTitle>
                        <CardDescription>
                            Enter your exam token and select your university
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Token Input */}
                            <div className="space-y-2">
                                <Label htmlFor="token">Exam Token *</Label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="Enter exam token"
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
                                <Label htmlFor="university">University *</Label>
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
                                        <SelectValue placeholder="Select university" />
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
                                <Label htmlFor="major">Major *</Label>
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
                                                    ? 'Select major'
                                                    : 'Select university first'
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
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {processing ? 'Starting Exam...' : 'Start Exam'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
