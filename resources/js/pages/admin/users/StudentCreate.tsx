// resources/js/pages/admin/users/StudentCreate.tsx

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
import { AlertCircle } from 'lucide-react';

interface School {
    id: number;
    name: string;
}

interface Props {
    schools: School[];
}

export default function StudentCreate({ schools }: Props) {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
        school_id: '',
        class: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const handleCancel = () => {
        window.location.href = '/admin/users';
    };

    const breadcrumbs = [
        { title: 'Users Management', href: '/admin/users' },
        { title: 'Create Student', href: '/admin/users/create-student' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Student" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Create New Student</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a new student to a school and class.
                    </p>
                </div>

                {/* Form */}
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Student Information</CardTitle>
                        <CardDescription>
                            Enter the student details. Fields marked with * are
                            required.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Full Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="John Doe"
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email Address{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="student@example.com"
                                    className={
                                        errors.email ? 'border-destructive' : ''
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className={
                                        errors.password
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Minimum 8 characters required
                                </p>
                            </div>

                            {/* School */}
                            <div className="space-y-2">
                                <Label htmlFor="school_id">School</Label>
                                <Select
                                    value={data.school_id}
                                    onValueChange={(value) =>
                                        setData('school_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="school_id"
                                        className={
                                            errors.school_id
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select a school" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((school) => (
                                            <SelectItem
                                                key={school.id}
                                                value={school.id.toString()}
                                            >
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.school_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.school_id}
                                    </p>
                                )}
                            </div>

                            {/* Class */}
                            <div className="space-y-2">
                                <Label htmlFor="class">Class</Label>
                                <Input
                                    id="class"
                                    value={data.class}
                                    onChange={(e) =>
                                        setData('class', e.target.value)
                                    }
                                    placeholder="10A, 8B, etc."
                                    className={
                                        errors.class ? 'border-destructive' : ''
                                    }
                                />
                                {errors.class && (
                                    <p className="text-sm text-destructive">
                                        {errors.class}
                                    </p>
                                )}
                            </div>

                            {/* Hidden role */}
                            {/* role is always "student" for this page */}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Student'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Students will be able to log in using their email and
                        password.
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
