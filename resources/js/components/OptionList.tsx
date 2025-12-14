import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function OptionList({
    questionId,
    options,
    value,
    optionsHtml,
    onSelect,
    onClear,
}: {
    questionId: number;
    options: { id: number; option_text: string }[];
    value: number | undefined;
    optionsHtml: Record<number, string>;
    onSelect: (questionId: number, optionId: number) => void;
    onClear: (questionId: number) => void;
}) {
    return (
        <>
            <RadioGroup
                value={value?.toString() || ''}
                onValueChange={(v) => onSelect(questionId, parseInt(v, 10))}
                className="space-y-3"
            >
                {options.map((option) => (
                    <div
                        key={option.id}
                        onClick={() => onSelect(questionId, option.id)}
                        className={cn(
                            'flex cursor-pointer items-start space-x-3 rounded-xl border-2 p-4 transition-all hover:bg-accent',
                            value === option.id
                                ? 'border-primary bg-accent ring-1 ring-primary'
                                : 'border-input hover:border-primary/50',
                        )}
                    >
                        <RadioGroupItem
                            value={option.id.toString()}
                            id={`option-${option.id}`}
                            className="pointer-events-none mt-1"
                        />

                        <div className="flex-1">
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_p]:my-2"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        optionsHtml[option.id] ??
                                        option.option_text,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </RadioGroup>

            {value && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClear(questionId)}
                    className="w-full md:w-auto"
                >
                    <X className="mr-2 h-4 w-4" />
                    Hapus Jawaban
                </Button>
            )}
        </>
    );
}
