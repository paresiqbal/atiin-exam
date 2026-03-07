import type { PropsWithChildren } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type ActionIconTooltipProps = PropsWithChildren<{
    label: string;
}>;

export default function ActionIconTooltip({
    label,
    children,
}: ActionIconTooltipProps) {
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
