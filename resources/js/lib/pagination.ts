const DEFAULT_MAX_PAGES = 3;

export function getPaginationRange(
    current: number,
    last: number,
    maxPages: number = DEFAULT_MAX_PAGES,
) {
    const safeLast = Math.max(1, last);
    const safeCurrent = Math.min(Math.max(1, current), safeLast);
    const safeMax = Math.max(1, maxPages);

    if (safeLast <= safeMax) {
        return Array.from({ length: safeLast }, (_, i) => i + 1);
    }

    const half = Math.floor(safeMax / 2);
    let start = Math.max(1, safeCurrent - half);
    let end = start + safeMax - 1;

    if (end > safeLast) {
        end = safeLast;
        start = Math.max(1, end - safeMax + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export type PaginationLink = { url: string | null; label: string; active: boolean };

const stripTags = (value: string) => value.replace(/<[^>]*>/g, '').trim();

const isPrevNextLabel = (value: string) => {
    const v = value.toLowerCase();
    return (
        v.includes('previous') ||
        v.includes('next') ||
        v.includes('&laquo;') ||
        v.includes('&raquo;') ||
        v.includes('«') ||
        v.includes('»')
    );
};

export function limitPaginationLinks(
    links: PaginationLink[],
    current: number,
    last: number,
    maxPages: number = DEFAULT_MAX_PAGES,
) {
    const range = new Set(
        getPaginationRange(current, last, maxPages).map((p) => String(p)),
    );

    return links.filter((link) => {
        const label = stripTags(link.label);
        if (isPrevNextLabel(label)) return true;
        if (/^\d+$/.test(label)) {
            return range.has(label);
        }
        return false;
    });
}
