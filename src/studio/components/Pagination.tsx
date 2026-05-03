// Compact pagination control. Hidden when total <= pageSize.
//
// Renders status (e.g. "1–10 of 24") and page navigation with ellipsis.

interface PaginationProps {
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
}

function pageList(current: number, total: number): Array<number | '…'> {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
}

export function Pagination({
    total, page, pageSize, onPageChange,
    pageSizeOptions, onPageSizeChange,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (total === 0) return null;

    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const pages = pageList(page, totalPages);
    const showNav = totalPages > 1;

    return (
        <div className="studio-pagination">
            <div className="studio-pagination-info">
                <span className="num">{start}</span>
                <span className="dash">–</span>
                <span className="num">{end}</span>
                <span className="of">of</span>
                <span className="num">{total}</span>
                {pageSizeOptions && onPageSizeChange && (
                    <>
                        <span className="sep">·</span>
                        <label className="page-size-select">
                            <select
                                value={pageSize}
                                onChange={e => onPageSizeChange(Number(e.target.value))}
                            >
                                {pageSizeOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <span>per page</span>
                        </label>
                    </>
                )}
            </div>

            {showNav && (
                <div className="studio-pagination-controls">
                    <button
                        className="studio-page-btn page-nav"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        aria-label="Previous page"
                    >
                        ‹
                    </button>
                    {pages.map((p, i) =>
                        p === '…' ? (
                            <span key={`e${i}`} className="studio-page-ellipsis">{p}</span>
                        ) : (
                            <button
                                key={p}
                                className={`studio-page-btn ${p === page ? 'active' : ''}`}
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        className="studio-page-btn page-nav"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        aria-label="Next page"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
