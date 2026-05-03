import { useEffect, useState, useCallback, useMemo } from 'react';
import { skillsApi } from '../api';
import type { Skill, FieldDef, SkillType } from '../types';
import { EntityEditor } from '../components/EntityEditor';
import { Toolbar } from '../components/Toolbar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const FIELDS: FieldDef[] = [
    { section: 'Identity', key: 'id', label: 'ID', type: 'text', required: true, width: 'half', placeholder: 'fireball', help: 'Unique slug, lowercase' },
    { section: 'Identity', key: 'name', label: 'Display Name', type: 'text', required: true, width: 'half', placeholder: 'Fireball' },
    {
        section: 'Effect',
        key: 'skill_type', label: 'Skill Type', type: 'select', required: true, width: 'half',
        options: [
            { value: 'magic', label: 'Magic' },
            { value: 'physical', label: 'Physical' },
            { value: 'buff', label: 'Buff' },
            { value: 'debuff', label: 'Debuff' },
        ],
    },
    {
        section: 'Effect',
        key: 'damage_type', label: 'Damage Type', type: 'select', width: 'half',
        options: [
            { value: 'magic', label: 'Magic' },
            { value: 'physical', label: 'Physical' },
            { value: 'true', label: 'True' },
        ],
    },
    { section: 'Effect', key: 'base_damage', label: 'Base Damage', type: 'number', min: 0, width: 'half' },
    { section: 'Effect', key: 'effect_multiplier', label: 'Multiplier', type: 'number', step: 0.1, width: 'half' },
    {
        section: 'Targeting',
        key: 'target_type', label: 'Target', type: 'select', width: 'third',
        options: [
            { value: 'single', label: 'Single' },
            { value: 'area', label: 'Area' },
            { value: 'line', label: 'Line' },
            { value: 'self', label: 'Self' },
        ],
    },
    { section: 'Targeting', key: 'range', label: 'Range', type: 'number', min: 0, width: 'third' },
    { section: 'Targeting', key: 'area_size', label: 'Area Size', type: 'number', min: 0, width: 'third' },
    { section: 'Cost', key: 'mp_cost', label: 'MP Cost', type: 'number', min: 0, width: 'half' },
    { section: 'Cost', key: 'cooldown', label: 'Cooldown', type: 'number', min: 0, width: 'half', help: 'In turns' },
    { section: 'Visuals', key: 'icon_url', label: 'Icon URL', type: 'url', width: 'half' },
    { section: 'Visuals', key: 'animation_id', label: 'Animation ID', type: 'text', width: 'half' },
    { section: 'Description', key: 'description', label: '', type: 'textarea', placeholder: 'What does this skill do?' },
];

const TYPE_GLYPH: Record<SkillType, string> = {
    magic: '✦',
    physical: '⚔',
    buff: '⊕',
    debuff: '⊖',
};

export function SkillsSection() {
    const [rows, setRows] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Skill | null>(null);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | SkillType>('all');

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRows(await skillsApi.list());
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const filtered = useMemo(() => {
        let list = rows;
        if (filter !== 'all') list = list.filter(r => r.skill_type === filter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.id?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [rows, filter, search]);

    const counts = useMemo(() => ({
        all: rows.length,
        magic: rows.filter(r => r.skill_type === 'magic').length,
        physical: rows.filter(r => r.skill_type === 'physical').length,
        buff: rows.filter(r => r.skill_type === 'buff').length,
        debuff: rows.filter(r => r.skill_type === 'debuff').length,
    }), [rows]);

    const { page, setPage, pageSize, total, paginated } = usePagination(filtered, `${filter}|${search}`);

    return (
        <div>
            <Toolbar
                title="Skills"
                subtitle="Magic & physical abilities used by units"
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Search skills…"
                actions={
                    <button className="studio-btn studio-btn-primary" onClick={() => setCreating(true)}>
                        New Skill
                    </button>
                }
            >
                <div className="studio-tabs">
                    {(['all', 'magic', 'physical', 'buff', 'debuff'] as const).map(t => (
                        <button
                            key={t}
                            className={`studio-tab ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                            <span className="studio-tab-count">{counts[t]}</span>
                        </button>
                    ))}
                </div>
            </Toolbar>

            {error && <div className="studio-error">⚠ {error}</div>}

            <div className="studio-card">
                <div className="studio-card-grid skills-grid">
                    <div className="skills-grid-head">
                        <div className="col-name">Skill</div>
                        <div className="col-num">Damage</div>
                        <div className="col-num">Range</div>
                        <div className="col-num">Area</div>
                        <div className="col-num">MP</div>
                        <div className="col-num">CD</div>
                        <div className="col-desc">Description</div>
                        <div className="col-actions"></div>
                    </div>
                    {loading ? (
                        <div className="studio-empty">Loading skills…</div>
                    ) : filtered.length === 0 ? (
                        <div className="studio-empty">
                            {search ? `No skills match "${search}"` : 'No skills yet.'}
                        </div>
                    ) : (
                        paginated.map(s => (
                            <div
                                key={s.id}
                                className="skills-grid-row"
                                onClick={() => setEditing(s)}
                            >
                                <div className="col-name">
                                    <span className={`skill-glyph type-${s.skill_type}`}>
                                        {TYPE_GLYPH[s.skill_type] || '◇'}
                                    </span>
                                    <div>
                                        <div className="unit-name">{s.name}</div>
                                        <div className="unit-meta">
                                            <span className="mono">{s.id}</span>
                                            <span className="dot">·</span>
                                            <span>{s.skill_type}</span>
                                            <span className="dot">·</span>
                                            <span>{s.damage_type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-num">{s.base_damage || '—'}</div>
                                <div className="col-num">{s.range || '—'}</div>
                                <div className="col-num">{s.area_size || '—'}</div>
                                <div className="col-num">{s.mp_cost || '—'}</div>
                                <div className="col-num">{s.cooldown || '—'}</div>
                                <div className="col-desc">{s.description || <span className="text-faint">—</span>}</div>
                                <div className="col-actions">
                                    <button
                                        className="studio-icon-btn row-action"
                                        onClick={(e) => { e.stopPropagation(); setEditing(s); }}
                                        title="Edit"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                            <path d="M11.5 2.5l2 2-7.5 7.5-3 1 1-3 7.5-7.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <Pagination
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            </div>

            <EntityEditor<Skill>
                title={creating ? 'New Skill' : `Edit Skill · ${editing?.name ?? ''}`}
                open={creating || editing !== null}
                initial={editing}
                fields={FIELDS}
                isEdit={!!editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSave={async value => { await skillsApi.save(value); await reload(); }}
                onDelete={editing ? async () => { await skillsApi.delete(editing.id); await reload(); } : undefined}
            />
        </div>
    );
}
