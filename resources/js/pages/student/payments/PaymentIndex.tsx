import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

type AccountType = 'regular' | 'pro';

interface AccountPageProps {
    [key: string]: unknown;
    account: {
        account_type: AccountType;
        is_pro: boolean;
        pro_expires_at?: string | null;
    };
}

export default function StudentAccountIndex() {
    const { account } = usePage<AccountPageProps>().props;

    const formatDate = (date?: string | null) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title="Akun Saya" />

            <div className="max-w-xl space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Akun Saya</h1>
                    <p className="text-muted-foreground">
                        Status akun dan langganan
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Akun</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Status</span>
                            {account.is_pro ? (
                                <Badge>PRO</Badge>
                            ) : (
                                <Badge variant="secondary">REGULAR</Badge>
                            )}
                        </div>

                        {account.is_pro && (
                            <div className="flex items-center justify-between text-sm">
                                <span>Masa berlaku</span>
                                <span>
                                    {account.pro_expires_at
                                        ? formatDate(account.pro_expires_at)
                                        : 'Lifetime'}
                                </span>
                            </div>
                        )}

                        {!account.is_pro && (
                            <div className="rounded-md bg-muted p-3 text-sm">
                                Upgrade ke <strong>Pro</strong> untuk membuka
                                fitur tambahan.
                            </div>
                        )}

                        <div className="pt-2">
                            <Button variant="outline" disabled>
                                Upgrade (Coming Soon)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
