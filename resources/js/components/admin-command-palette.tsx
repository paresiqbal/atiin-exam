import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface SearchItem {
    id: number;
    label: string;
    description: string | null;
    href: string;
}

interface SearchResults {
    students: SearchItem[];
    exams: SearchItem[];
    question_banks: SearchItem[];
}

const emptyResults: SearchResults = {
    students: [],
    exams: [],
    question_banks: [],
};

const adminPages = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Question Banks', href: '/admin/question-banks' },
    { label: 'Exams', href: '/admin/exams' },
    { label: 'Students', href: '/admin/students' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Payments', href: '/admin/payments' },
    { label: 'Schools', href: '/admin/schools' },
    { label: 'Universities', href: '/admin/universities' },
    { label: 'IRT', href: '/admin/irt' },
    { label: 'News', href: '/admin/news' },
    { label: 'Consultant Requests', href: '/admin/consultant-requests' },
];

export default function AdminCommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<SearchResults>(emptyResults);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasResults =
        results.students.length > 0 ||
        results.exams.length > 0 ||
        results.question_banks.length > 0;

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setOpen(true);
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const query = search.trim();

        if (!open || query === '') {
            setResults(emptyResults);
            setError(null);
            setLoading(false);

            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/admin/search?q=${encodeURIComponent(query)}`,
                    {
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(`Search failed (${response.status}).`);
                }

                setResults((await response.json()) as SearchResults);
            } catch (searchError) {
                if (!controller.signal.aborted) {
                    setError(
                        searchError instanceof Error
                            ? searchError.message
                            : 'Search failed.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [open, search]);

    function changeOpen(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            setSearch('');
            setResults(emptyResults);
            setError(null);
        }
    }

    function visit(href: string) {
        changeOpen(false);
        router.visit(href);
    }

    return (
        <CommandDialog
            open={open}
            onOpenChange={changeOpen}
            title="Admin search"
            description="Search admin pages, students, exams, and question banks."
        >
            <Command shouldFilter={false}>
                <CommandInput
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search pages and records..."
                />
                <CommandList>
                    {error ? (
                        <CommandEmpty>{error}</CommandEmpty>
                    ) : loading ? (
                        <CommandEmpty>Searching...</CommandEmpty>
                    ) : search.trim() === '' ? (
                        <CommandGroup heading="Pages">
                            {adminPages.map((page) => (
                                <CommandItem
                                    key={page.href}
                                    value={page.label}
                                    onSelect={() => visit(page.href)}
                                >
                                    {page.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : (
                        <>
                            {!hasResults && (
                                <CommandEmpty>No results found.</CommandEmpty>
                            )}
                            {results.students.length > 0 && (
                                <CommandGroup heading="Students">
                                    {results.students.map((item) => (
                                        <CommandItem
                                            key={`student-${item.id}`}
                                            value={`${item.label} ${item.description ?? ''}`}
                                            onSelect={() => visit(item.href)}
                                        >
                                            <span>{item.label}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.exams.length > 0 && (
                                <CommandGroup heading="Exams">
                                    {results.exams.map((item) => (
                                        <CommandItem
                                            key={`exam-${item.id}`}
                                            value={`${item.label} ${item.description ?? ''}`}
                                            onSelect={() => visit(item.href)}
                                        >
                                            <span>{item.label}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {results.question_banks.length > 0 && (
                                <CommandGroup heading="Question Banks">
                                    {results.question_banks.map((item) => (
                                        <CommandItem
                                            key={`question-bank-${item.id}`}
                                            value={item.label}
                                            onSelect={() => visit(item.href)}
                                        >
                                            {item.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </>
                    )}
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
