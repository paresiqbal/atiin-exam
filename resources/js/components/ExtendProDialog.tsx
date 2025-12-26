'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { ClockArrowUp } from 'lucide-react';

export default function ExtendProDialog({
    disabled,
    onExtend,
}: {
    disabled?: boolean;
    onExtend: (months: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [months, setMonths] = useState('1');

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={disabled}
                        aria-label="Perpanjang Pro"
                        onClick={() => setOpen(true)}
                    >
                        <ClockArrowUp className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Perpanjang Pro</TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Perpanjang Pro</DialogTitle>
                        <DialogDescription>
                            Tambah masa aktif Pro (dalam bulan).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label>Bulan</Label>
                        <Select value={months} onValueChange={setMonths}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1,
                                ).map((m) => (
                                    <SelectItem key={m} value={String(m)}>
                                        {m} bulan
                                    </SelectItem>
                                ))}
                                <SelectItem value="24">24 bulan</SelectItem>
                                <SelectItem value="36">36 bulan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                onExtend(Number(months));
                                setOpen(false);
                            }}
                        >
                            Perpanjang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
