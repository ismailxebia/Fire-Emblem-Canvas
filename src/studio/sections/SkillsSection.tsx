import { useEffect, useState, useCallback } from 'react';
import { skillsApi } from '../api';
import type { Skill, FieldDef } from '../types';
import { DataTable } from '../components/DataTable';
import { EntityEditor } from '../components/EntityEditor';

const FIELDS: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'text', required: true, width: 'half', placeholder: 'fireball', help: 'Unique slug, lowercase + underscores' },
    { key: 'name', label: 'Display Name', type: 'text', required: true, width: 'half', placeholder: 'Fireball' },
    {
        key: 'skill_type', label: 'Skill Type', type: 'select', required: true, width: 'half',
        options: [
            { value: 'magic', label: 'Magic' },
            { value: 'physical', label: 'Physical' },
            { value: 'buff', label: 'Buff' },
            { value: 'debuff', label: 'Debuff' },
        ],
    },
    {
        key: 'damage_type', label: 'Damage Type', type: 'select', width: 'half',
        options: [
            { value: 'magic', label: 'Magic' },
            { value: 'physical', label: 'Physical' },
            { value: 'true', label: 'True' },
        ],
    },
    { key: 'base_damage', label: 'Base Damage', type: 'number', min: 0, width: 'third' },
    { key: 'effect_multiplier', label: 'Multiplier', type: 'number', step: 0.1, width: 'third' },
    {
        key: 'target_type', label: 'Target', type: 'select', width: 'third',
        options: [
            { value: 'single', label: 'Single' },
            { value: 'area', label: 'Area' },
            { value: 'line', label: 'Line' },
            { value: 'self', label: 'Self' },
        ],
    },
    { key: 'range', label: 'Range', type: 'number', min: 0, width: 'third' },
    { key: 'area_size', label: 'Area Size', type: 'number', min: 0, width: 'third' },
    { key: 'mp_cost', label: 'MP Cost', type: 'number', min: 0, width: 'third' },
    { key: 'cooldown', label: 'Cooldown (turns)', type: 'number', min: 0, width: 'third' },
    { key: 'icon_url', label: 'Icon URL', type: 'url', width: 'half' },
    { key: 'animation_id', label: 'Animation ID', type: 'text', width: 'half' },
    { key: 'description', label: 'Description', type: 'textarea' },
];

export function SkillsSection() {
    const [rows, setRows] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Skill | null>(null);
    const [creating, setCreating] = useState(false);

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

    return (
        <div>
            <div className="studio-section-head">
                <div>
                    <h1>Skills</h1>
                    <p className="studio-subtle">Magic & physical skills available to units.</p>
                </div>
                <button className="studio-btn studio-btn-primary" onClick={() => setCreating(true)}>
                    + New Skill
                </button>
            </div>

            {error && <div className="studio-error">⚠ {error}</div>}

            <DataTable<Skill>
                loading={loading}
                rows={rows}
                onRowClick={row => setEditing(row)}
                columns={[
                    { key: 'id', label: 'ID', width: '14%' },
                    { key: 'name', label: 'Name', width: '18%' },
                    { key: 'skill_type', label: 'Type', width: '10%' },
                    { key: 'base_damage', label: 'Damage', width: '8%' },
                    { key: 'range', label: 'Range', width: '7%' },
                    { key: 'mp_cost', label: 'MP', width: '7%' },
                    { key: 'description', label: 'Description' },
                ]}
            />

            <EntityEditor<Skill>
                title={creating ? 'New Skill' : `Edit Skill: ${editing?.name ?? ''}`}
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
