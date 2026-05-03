import { useEffect, useState, useCallback, useMemo } from 'react';
import { unitsApi, skillsApi } from '../api';
import type { Unit, Skill, FieldDef } from '../types';
import { EntityEditor } from '../components/EntityEditor';
import { Toolbar } from '../components/Toolbar';
import { StatBars } from '../components/StatBars';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { SpritePreview } from '../components/SpritePreview';

function buildFields(skills: Skill[]): FieldDef[] {
    return [
        { section: 'Identity', key: 'id', label: 'ID', type: 'text', required: true, width: 'half', placeholder: 'hero1', help: 'Unique slug' },
        { section: 'Identity', key: 'name', label: 'Display Name', type: 'text', required: true, width: 'half', placeholder: 'Leonardo' },
        {
            section: 'Identity',
            key: 'unit_type', label: 'Unit Type', type: 'select', required: true, width: 'half',
            options: [
                { value: 'hero', label: 'Hero' },
                { value: 'enemy', label: 'Enemy' },
            ],
        },
        { section: 'Identity', key: 'level', label: 'Level', type: 'number', min: 1, width: 'half' },
        { section: 'Identity', key: 'star', label: 'Rarity (1-5)', type: 'number', min: 1, max: 5, width: 'half' },

        { section: 'Combat Stats', key: 'base_hp', label: 'HP', type: 'number', min: 1, width: 'third' },
        { section: 'Combat Stats', key: 'base_atk', label: 'ATK', type: 'number', min: 0, width: 'third' },
        { section: 'Combat Stats', key: 'base_def', label: 'DEF', type: 'number', min: 0, width: 'third' },
        { section: 'Combat Stats', key: 'base_spd', label: 'SPD', type: 'number', min: 0, width: 'third' },
        { section: 'Combat Stats', key: 'base_res', label: 'RES', type: 'number', min: 0, width: 'third' },

        { section: 'Growth Rates (%)', key: 'growth_hp', label: 'HP Growth', type: 'number', min: 0, max: 100, width: 'third' },
        { section: 'Growth Rates (%)', key: 'growth_atk', label: 'ATK Growth', type: 'number', min: 0, max: 100, width: 'third' },
        { section: 'Growth Rates (%)', key: 'growth_def', label: 'DEF Growth', type: 'number', min: 0, max: 100, width: 'third' },
        { section: 'Growth Rates (%)', key: 'growth_spd', label: 'SPD Growth', type: 'number', min: 0, max: 100, width: 'third' },
        { section: 'Growth Rates (%)', key: 'growth_res', label: 'RES Growth', type: 'number', min: 0, max: 100, width: 'third' },

        { section: 'Movement & Range', key: 'attack_range', label: 'Attack Range', type: 'number', min: 1, width: 'half', help: '1 = melee, 2-3 = ranged' },
        { section: 'Movement & Range', key: 'movement_range', label: 'Movement Range', type: 'number', min: 1, width: 'half', help: 'Tiles per turn' },

        {
            section: 'Skill',
            key: 'magic_skill_id', label: 'Magic Skill', type: 'select', width: 'full',
            options: skills.map(s => ({ value: s.id, label: `${s.name} (${s.id})` })),
        },

        { section: 'Visuals', key: 'sprite_url', label: 'Sprite Sheet URL', type: 'url', help: '4×3 frames spritesheet' },
        { section: 'Visuals', key: 'portrait_url', label: 'Portrait URL', type: 'url', help: 'Avatar shown in HUD' },
    ];
}

export function UnitsSection() {
    const [rows, setRows] = useState<Unit[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Unit | null>(null);
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState<'all' | 'hero' | 'enemy'>('all');
    const [search, setSearch] = useState('');

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [u, s] = await Promise.all([unitsApi.list(), skillsApi.list()]);
            setRows(u);
            setSkills(s);
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const fields = useMemo(() => buildFields(skills), [skills]);

    const filtered = useMemo(() => {
        let list = rows;
        if (filter !== 'all') list = list.filter(r => r.unit_type === filter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.id?.toLowerCase().includes(q) ||
                r.magic_skill_id?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [rows, filter, search]);

    const counts = useMemo(() => ({
        all: rows.length,
        hero: rows.filter(r => r.unit_type === 'hero').length,
        enemy: rows.filter(r => r.unit_type === 'enemy').length,
    }), [rows]);

    const { page, setPage, pageSize, total, paginated } = usePagination(filtered, `${filter}|${search}`);

    return (
        <div>
            <Toolbar
                title="Units"
                subtitle="Master data for heroes & enemies"
                search={search}
                onSearch={setSearch}
                searchPlaceholder="Search by name, id, or skill…"
                actions={
                    <button className="studio-btn studio-btn-primary" onClick={() => setCreating(true)}>
                        New Unit
                    </button>
                }
            >
                <div className="studio-tabs">
                    {(['all', 'hero', 'enemy'] as const).map(t => (
                        <button
                            key={t}
                            className={`studio-tab ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t === 'all' ? 'All' : t === 'hero' ? 'Heroes' : 'Enemies'}
                            <span className="studio-tab-count">{counts[t]}</span>
                        </button>
                    ))}
                </div>
            </Toolbar>

            {error && <div className="studio-error">⚠ {error}</div>}

            <div className="studio-card">
                <div className="studio-card-grid units-grid">
                    <div className="units-grid-head">
                        <div className="col-name">Unit</div>
                        <div className="col-lv">Lv</div>
                        <div className="col-stats">Stats</div>
                        <div className="col-meta">Range · Move</div>
                        <div className="col-skill">Skill</div>
                        <div className="col-actions"></div>
                    </div>

                    {loading ? (
                        <div className="studio-empty">Loading units…</div>
                    ) : filtered.length === 0 ? (
                        <div className="studio-empty">
                            {search ? `No units match "${search}"` : 'No units yet. Click "New Unit" to create one.'}
                        </div>
                    ) : (
                        paginated.map(u => (
                            <div
                                key={u.id}
                                className="units-grid-row"
                                onClick={() => setEditing(u)}
                            >
                                <div className="col-name">
                                    <div className="unit-avatar">
                                        {u.portrait_url
                                            ? <img src={u.portrait_url} alt="" />
                                            : <div className="unit-avatar-empty">{u.name?.charAt(0) ?? '?'}</div>
                                        }
                                        <span className={`unit-avatar-dot dot-${u.unit_type}`} />
                                    </div>
                                    <div className="unit-name-col">
                                        <div className="unit-name">{u.name}</div>
                                        <div className="unit-meta">
                                            <span className="mono">{u.id}</span>
                                            <span className="dot">·</span>
                                            <span className={`type-${u.unit_type}`}>{u.unit_type}</span>
                                            <span className="dot">·</span>
                                            <span>{'★'.repeat(u.star)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lv">
                                    <div className="lv-chip">{u.level}</div>
                                </div>
                                <div className="col-stats">
                                    <StatBars
                                        hp={u.base_hp}
                                        atk={u.base_atk}
                                        def={u.base_def}
                                        spd={u.base_spd}
                                        res={u.base_res}
                                    />
                                </div>
                                <div className="col-meta">
                                    <span className="meta-pair">
                                        <span className="meta-label">RNG</span>
                                        <span className="meta-value">{u.attack_range}</span>
                                    </span>
                                    <span className="meta-pair">
                                        <span className="meta-label">MOV</span>
                                        <span className="meta-value">{u.movement_range}</span>
                                    </span>
                                </div>
                                <div className="col-skill">
                                    {u.magic_skill_id ? (
                                        <span className="skill-chip">{u.magic_skill_id}</span>
                                    ) : (
                                        <span className="text-faint">—</span>
                                    )}
                                </div>
                                <div className="col-actions">
                                    <button
                                        className="studio-icon-btn row-action"
                                        onClick={(e) => { e.stopPropagation(); setEditing(u); }}
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

            <EntityEditor<Unit>
                title={creating ? 'New Unit' : `Edit Unit · ${editing?.name ?? ''}`}
                open={creating || editing !== null}
                initial={editing}
                fields={fields}
                isEdit={!!editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSave={async value => { await unitsApi.save(value); await reload(); }}
                onDelete={editing ? async () => { await unitsApi.delete(editing.id); await reload(); } : undefined}
                sidePreview={(values) => <SpritePreview url={values.sprite_url} />}
            />
        </div>
    );
}
