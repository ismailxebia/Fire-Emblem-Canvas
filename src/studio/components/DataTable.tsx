import React from 'react';

export interface ColumnDef<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    rows: T[];
    onRowClick?: (row: T) => void;
    emptyText?: string;
    loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    columns, rows, onRowClick, emptyText = 'No data yet.', loading,
}: DataTableProps<T>) {
    if (loading) {
        return <div className="studio-loading">Loading…</div>;
    }
    if (!rows.length) {
        return <div className="studio-empty">{emptyText}</div>;
    }
    return (
        <div className="studio-table-wrap">
            <table className="studio-table">
                <thead>
                    <tr>
                        {columns.map(c => (
                            <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr
                            key={(row.id ?? idx) as React.Key}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'clickable' : ''}
                        >
                            {columns.map(c => (
                                <td key={c.key}>
                                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
