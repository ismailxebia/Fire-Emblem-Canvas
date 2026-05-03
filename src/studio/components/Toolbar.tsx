// Workspace toolbar: title + breadcrumb + search + actions.
// Sticky to top of content area.

import type { ReactNode } from 'react';

interface ToolbarProps {
    title: string;
    subtitle?: string;
    search?: string;
    onSearch?: (value: string) => void;
    searchPlaceholder?: string;
    actions?: ReactNode;
    children?: ReactNode;
}

export function Toolbar({
    title, subtitle, search, onSearch, searchPlaceholder = 'Search…', actions, children,
}: ToolbarProps) {
    return (
        <header className="studio-toolbar-head">
            <div className="studio-toolbar-row">
                <div className="studio-toolbar-title">
                    <h1>{title}</h1>
                    {subtitle && <p className="studio-subtle">{subtitle}</p>}
                </div>
                <div className="studio-toolbar-actions">
                    {onSearch !== undefined && (
                        <div className="studio-search">
                            <span className="studio-search-icon">⌕</span>
                            <input
                                type="text"
                                value={search ?? ''}
                                onChange={e => onSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                spellCheck={false}
                            />
                            {search && (
                                <button className="studio-search-clear" onClick={() => onSearch('')} aria-label="Clear">×</button>
                            )}
                        </div>
                    )}
                    {actions}
                </div>
            </div>
            {children && <div className="studio-toolbar-row">{children}</div>}
        </header>
    );
}
