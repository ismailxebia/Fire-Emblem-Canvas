import { useEffect, useState, useCallback, useMemo } from 'react';
import { unitsApi, skillsApi } from '../api';
import type { Unit, Skill, FieldDef } from '../types';
import { DataTable } from '../components/DataTable';
import { EntityEditor } from '../components/EntityEditor';

function buildFields(skills: Skill[]): FieldDef[] {
    return [
        { key: 'id', label: 'ID', type: 'text', required: true, width: 'half', placeholder: 'hero1', help: 'Unique slug' },
        { key: 'name', label: 'Display Name', type: 'text', required: true, width: 'half', placeholder: 'Leonardo' },
        {
            key: 'unit_type', label: 'Unit Type', type: 'select', required: true, width: 'half',
            options: [
                { value: 'hero', label: 'Hero' },
                { value: 'enemy', label: 'Enemy' },
            ],
        },
        { key: 'level', label: 'Level', type: 'number', min: 1, width: 'half' },

        { key: 'base_hp', label: 'HP', type: 'number', min: 1, width: 'third' },
        { key: 'base_atk', label: 'ATK', type: 'number', min: 0, width: 'third' },
        { key: 'base_spd', label: 'SPD', type: 'number', min: 0, width: 'third' },
        { key: 'base_def', label: 'DEF', type: 'number', min: 0, width: 'third' },
        { key: 'base_res', label: 'RES', type: 'number', min: 0, width: 'third' },
        { key: 'star', label: 'Star (rarity)', type: 'number', min: 1, max: 5, width: 'third' },

        { key: 'attack_range', label: 'Attack Range', type: 'number', min: 1, width: 'half', help: '1 = melee, 2-3 = ranged' },
        { key: 'movement_range', label: 'Movement Range', type: 'number', min: 1, width: 'half', help: 'Tiles per turn' },

        { key: 'sprite_url', label: 'Sprite Sheet URL', type: 'url', help: 'Spritesheet 4×3 frames' },
        { key: 'portrait_url', label: 'Portrait URL', type: 'url', help: 'Avatar shown in HUD' },

        {
            key: 'magic_skill_id', label: 'Magic Skill', type: 'select', width: 'half',
            options: skills.map(s => ({ value: s.id, label: `${s.name} (${s.id})` })),
            help: 'Skill triggered when unit casts magic',
        },
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
        if (filter === 'all') return rows;
        return rows.filter(r => r.unit_type === filter);
    }, [rows, filter]);

    return (
        <div>
            <div className="studio-section-head">
                <div>
                    <h1>Units</h1>
                    <p className="studio-subtle">Master data for heroes & enemies.</p>
                </div>
                <button className="studio-btn studio-btn-primary" onClick={() => setCreating(true)}>
                    + New Unit
                </button>
            </div>

            <div className="studio-toolbar">
                <div className="studio-tabs">
                    {(['all', 'hero', 'enemy'] as const).map(t => (
                        <button
                            key={t}
                            className={`studio-tab ${filter === t ? 'active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t === 'all' ? 'All' : t === 'hero' ? 'Heroes' : 'Enemies'}
                            <span className="studio-tab-count">
                                {t === 'all' ? rows.length : rows.filter(r => r.unit_type === t).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="studio-error">⚠ {error}</div>}

            <DataTable<Unit>
                loading={loading}
                rows={filtered}
                onRowClick={row => setEditing(row)}
                columns={[
                    {
                        key: 'portrait_url', label: '', width: '52px',
                        render: r => r.portrait_url ? (
                            <img src={r.portrait_url} alt="" className="studio-thumb" />
                        ) : <div className="studio-thumb-empty">—</div>,
                    },
                    { key: 'id', label: 'ID', width: '12%' },
                    { key: 'name', label: 'Name', width: '15%' },
                    {
                        key: 'unit_type', label: 'Type', width: '8%',
                        render: r => (
                            <span className={`studio-badge ${r.unit_type === 'hero' ? 'badge-hero' : 'badge-enemy'}`}>
                                {r.unit_type}
                            </span>
                        ),
                    },
                    { key: 'level', label: 'Lv', width: '5%' },
                    {
                        key: 'stats', label: 'HP / ATK / DEF / SPD / RES',
                        render: r => `${r.base_hp} / ${r.base_atk} / ${r.base_def} / ${r.base_spd} / ${r.base_res}`,
                    },
                    { key: 'attack_range', label: 'Atk Rng', width: '7%' },
                    { key: 'movement_range', label: 'Move', width: '7%' },
                    { key: 'magic_skill_id', label: 'Skill' },
                ]}
            />

            <EntityEditor<Unit>
                title={creating ? 'New Unit' : `Edit Unit: ${editing?.name ?? ''}`}
                open={creating || editing !== null}
                initial={editing}
                fields={fields}
                isEdit={!!editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSave={async value => { await unitsApi.save(value); await reload(); }}
                onDelete={editing ? async () => { await unitsApi.delete(editing.id); await reload(); } : undefined}
            />
        </div>
    );
}
