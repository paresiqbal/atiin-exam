export function resolveHtmlImages(html: string) {
    if (!html) return html;
    if (typeof window === 'undefined') return html;

    try {
        const base = window.location.origin;
        const doc = new DOMParser().parseFromString(html, 'text/html');

        doc.querySelectorAll('img').forEach((img) => {
            const raw = (img.getAttribute('src') || '').trim();
            if (!raw) return;

            if (
                raw.startsWith('http://') ||
                raw.startsWith('https://') ||
                raw.startsWith('data:') ||
                raw.startsWith('blob:')
            ) {
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                return;
            }

            if (/^[a-zA-Z]:\\/.test(raw) || raw.startsWith('file://')) {
                img.setAttribute(
                    'data-warning',
                    'invalid-local-file-src-not-accessible',
                );
                return;
            }

            const normalized = raw.startsWith('/')
                ? raw
                : raw.startsWith('storage/')
                  ? `/${raw}`
                  : raw.startsWith('uploads/')
                    ? `/${raw}`
                    : `/${raw}`;

            img.setAttribute('src', `${base}${normalized}`);
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });

        return doc.body.innerHTML;
    } catch {
        return html;
    }
}

export const extractFirstImageSrc = (html?: string | null): string | null => {
    if (!html) return null;
    const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    return match ? match[1] : null;
};

export const toAbsoluteUrl = (src: string) => {
    if (typeof window === 'undefined') return src;
    try {
        return new URL(src, window.location.origin).toString();
    } catch {
        return src;
    }
};

export const normalizeImageSrc = (src: string): string | null => {
    const raw = (src || '').trim();
    if (!raw) return null;

    if (/^[a-zA-Z]:\\/.test(raw) || raw.startsWith('file://')) return null;

    if (
        raw.startsWith('http://') ||
        raw.startsWith('https://') ||
        raw.startsWith('data:') ||
        raw.startsWith('blob:')
    ) {
        return raw;
    }

    const normalized = raw.startsWith('/')
        ? raw
        : raw.startsWith('storage/')
          ? `/${raw}`
          : raw.startsWith('uploads/')
            ? `/${raw}`
            : `/${raw}`;

    return toAbsoluteUrl(normalized);
};
