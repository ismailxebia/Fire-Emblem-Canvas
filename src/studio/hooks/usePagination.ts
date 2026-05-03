import { useState, useEffect, useMemo } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Local pagination over an array. Resets to page 1 whenever the filter
 * key changes (search query, type filter, etc).
 */
export function usePagination<T>(items: T[], filterKey: unknown, pageSize = DEFAULT_PAGE_SIZE) {
    const [page, setPage] = useState(1);

    // Reset to first page when the filter changes
    useEffect(() => {
        setPage(1);
    }, [filterKey]);

    // Clamp page if it became invalid (e.g. after delete reduces total)
    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        if (page > totalPages) setPage(totalPages);
    }, [items.length, page, pageSize]);

    const paginated = useMemo(
        () => items.slice((page - 1) * pageSize, page * pageSize),
        [items, page, pageSize]
    );

    return {
        page,
        setPage,
        pageSize,
        total: items.length,
        paginated,
    };
}
