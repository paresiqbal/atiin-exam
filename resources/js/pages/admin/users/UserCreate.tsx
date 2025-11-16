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

interface BreadcrumbItem {
    title: string;
    href: string;
}

const createBreadcrumbs = (): BreadcrumbItem[] => {
    return [
        { title: 'Users Management', href: '/admin/users' },
        { title: 'Create User', href: '/admin/users/create' },
    ];
};

export default function UserCreate() {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'student',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const handleCancel = () => {
        window.location.href = '/admin/users';
    };

    const breadcrumbs = createBreadcrumbs();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Create New User</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a new user to the system. Fill in all required
                        fields.
                    </p>
                </div>

                {/* Form */}
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                        <CardDescription>
                            Enter the user details. Fields marked with * are
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
                                    placeholder="john@example.com"
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

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Role{' '}
                                    <span className="text-destructive">*</span>
                                </Label>

                                <Select
                                    value={data.role}
                                    onValueChange={(value) =>
                                        setData('role', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="role"
                                        className={
                                            errors.role
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="student">
                                            Student
                                        </SelectItem>
                                        <SelectItem value="instructor">
                                            Instructor
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {errors.role && (
                                    <p className="text-sm text-destructive">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    {processing ? 'Creating...' : 'Create User'}
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
                        New users must verify their email before signing in.
                    </AlertDescription>
                </Alert>
            </div>
        </AppLayout>
    );
}
