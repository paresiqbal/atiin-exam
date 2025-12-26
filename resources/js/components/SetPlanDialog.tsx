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
import { useMemo, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Hourglass } from 'lucide-react';

type AccountType = 'regular' | 'pro';

function toISODateString(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function parseToDate(value?: string | null) {
    if (!value) return undefined;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
}

export default function SetPlanDialog({
    currentType,
    currentExpiry,
    onSave,
}: {
    currentType: AccountType;
    currentExpiry: string | null;
    onSave: (payload: {
        account_type: AccountType;
        pro_expires_at?: string | null;
    }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<AccountType>(currentType);
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(
        parseToDate(currentExpiry),
    );

    const expiryStr = useMemo(() => {
        if (!expiryDate) return '';
        return toISODateString(expiryDate);
    }, [expiryDate]);

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="outline"
                        aria-label="Atur tipe akun"
                        onClick={() => {
                            setType(currentType);
                            setExpiryDate(parseToDate(currentExpiry));
                            setOpen(true);
                        }}
                    >
                        <Hourglass className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Atur Tipe Akun</TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atur Tipe Akun</DialogTitle>
                        <DialogDescription>
                            Ubah manual Regular / Pro dan tanggal berakhir
                            (opsional).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipe Akun</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as AccountType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">
                                        Regular
                                    </SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Tanggal Berakhir Pro (opsional)
                                <span className="ml-2 text-xs text-muted-foreground">
                                    (kosongkan untuk tanpa batas)
                                </span>
                            </Label>

                            {/* shadcn Date Picker */}
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                            disabled={type !== 'pro'}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {type !== 'pro'
                                                ? 'Hanya untuk Pro'
                                                : expiryDate
                                                  ? format(
                                                        expiryDate,
                                                        'dd MMM yyyy',
                                                        { locale: id },
                                                    )
                                                  : 'Pilih tanggal'}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={expiryDate}
                                            onSelect={(d) =>
                                                setExpiryDate(d ?? undefined)
                                            }
                                            initialFocus
                                            disabled={(date) =>
                                                date < new Date()
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        {type === 'pro' && expiryDate && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setExpiryDate(undefined)}
                                className="shrink-0"
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                onSave({
                                    account_type: type,
                                    pro_expires_at:
                                        type === 'pro'
                                            ? expiryStr
                                                ? expiryStr
                                                : null
                                            : null,
                                });
                                setOpen(false);
                            }}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
