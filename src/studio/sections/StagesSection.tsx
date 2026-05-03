import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    stagesApi, stageHeroPosApi, stageEnemySpawnApi, stageObstacleApi, unitsApi,
} from '../api';
import type {
    Stage, StageHeroPosition, StageEnemySpawn, StageObstacle, Unit, FieldDef, ObstacleType, AIType,
} from '../types';
import { DataTable } from '../components/DataTable';
import { EntityEditor } from '../components/EntityEditor';
import { GridEditor } from '../components/GridEditor';
import { Toolbar } from '../components/Toolbar';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { SpritePreview } from '../components/SpritePreview';
import type { CellData, InteractIntent } from '../components/GridEditor';

const STAGE_FIELDS: FieldDef[] = [
    { section: 'Identity', key: 'id', label: 'ID', type: 'text', required: true, width: 'half', placeholder: 'stage01' },
    { section: 'Identity', key: 'name', label: 'Stage Name', type: 'text', required: true, width: 'half', placeholder: 'Battle of Armageddon' },
    { section: 'Identity', key: 'chapter', label: 'Chapter', type: 'number', min: 1, width: 'third' },
    { section: 'Identity', key: 'stage_order', label: 'Order in Chapter', type: 'number', min: 1, width: 'third' },
    {
        section: 'Identity',
        key: 'difficulty', label: 'Difficulty', type: 'select', width: 'third',
        options: [
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
            { value: 'nightmare', label: 'Nightmare' },
        ],
    },

    { section: 'Battle Setup', key: 'max_heroes', label: 'Max Heroes', type: 'number', min: 1, max: 6, width: 'third' },
    { section: 'Battle Setup', key: 'recommended_level', label: 'Rec. Level', type: 'number', min: 1, width: 'third' },
    { section: 'Battle Setup', key: 'is_published', label: 'Published', type: 'boolean', width: 'third', help: 'Visible to players' },

    { section: 'Rewards', key: 'exp_reward', label: 'EXP Reward', type: 'number', min: 0, width: 'half' },
    { section: 'Rewards', key: 'gold_reward', label: 'Gold Reward', type: 'number', min: 0, width: 'half' },

    { section: 'Visuals & Effects', key: 'background_url', label: 'Background URL', type: 'url' },
    { section: 'Visuals & Effects', key: 'has_clouds', label: 'Clouds', type: 'boolean', width: 'third' },
    { section: 'Visuals & Effects', key: 'has_rain', label: 'Rain', type: 'boolean', width: 'third' },
    { section: 'Visuals & Effects', key: 'has_snow', label: 'Snow', type: 'boolean', width: 'third' },
];

export function StagesSection() {
    const [rows, setRows] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Stage | null>(null);
    const [creating, setCreating] = useState(false);
    const [openSubEditor, setOpenSubEditor] = useState<Stage | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRows(await stagesApi.list());
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const { page, setPage, pageSize, total, paginated } = usePagination(rows, '');

    return (
        <div>
            <Toolbar
                title="Stages"
                subtitle="Battle maps · Open Layout to visually place units & obstacles"
                actions={
                    <button className="studio-btn studio-btn-primary" onClick={() => setCreating(true)}>
                        New Stage
                    </button>
                }
            />

            {error && <div className="studio-error">⚠ {error}</div>}

            <div className="studio-card">
                <DataTable<Stage>
                    loading={loading}
                    rows={paginated}
                    columns={[
                        { key: 'id', label: 'ID', width: '12%' },
                        { key: 'name', label: 'Name' },
                        { key: 'chapter', label: 'Chap', width: '6%' },
                        { key: 'stage_order', label: 'Order', width: '6%' },
                        {
                            key: 'difficulty', label: 'Difficulty', width: '10%',
                            render: r => <span className={`studio-badge badge-${r.difficulty}`}>{r.difficulty}</span>,
                        },
                        { key: 'max_heroes', label: 'Heroes', width: '6%' },
                        {
                            key: 'is_published', label: 'Status', width: '10%',
                            render: r => r.is_published
                                ? <span className="studio-badge badge-published">published</span>
                                : <span className="studio-badge badge-draft">draft</span>,
                        },
                        {
                            key: 'actions', label: '', width: '180px',
                            render: r => (
                                <div className="studio-row-actions">
                                    <button className="studio-btn studio-btn-ghost" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>
                                        Edit
                                    </button>
                                    <button className="studio-btn studio-btn-primary" onClick={(e) => { e.stopPropagation(); setOpenSubEditor(r); }}>
                                        Layout →
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                />
                <Pagination
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            </div>

            <EntityEditor<Stage>
                title={creating ? 'New Stage' : `Edit Stage: ${editing?.name ?? ''}`}
                open={creating || editing !== null}
                initial={editing}
                fields={STAGE_FIELDS}
                isEdit={!!editing}
                onClose={() => { setEditing(null); setCreating(false); }}
                onSave={async value => { await stagesApi.save(value); await reload(); }}
                onDelete={editing ? async () => { await stagesApi.delete(editing.id); await reload(); } : undefined}
            />

            {openSubEditor && (
                <StageLayoutEditor
                    stage={openSubEditor}
                    onClose={() => setOpenSubEditor(null)}
                />
            )}
        </div>
    );
}

// ===== Stage Layout Editor =============================================

function StageLayoutEditor({ stage, onClose }: { stage: Stage; onClose: () => void }) {
    const [tab, setTab] = useState<'heroes' | 'enemies' | 'obstacles'>('obstacles');
    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => { unitsApi.list().then(setUnits).catch(() => { }); }, []);

    return (
        <div className="studio-modal-backdrop" onClick={onClose}>
            <div className="studio-modal studio-modal-wide studio-modal-tall" onClick={e => e.stopPropagation()}>
                <div className="studio-modal-header">
                    <h2>Layout: {stage.name}</h2>
                    <button className="studio-icon-btn" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="studio-sub-tabs">
                    <button className={`studio-tab ${tab === 'obstacles' ? 'active' : ''}`} onClick={() => setTab('obstacles')}>
                        Obstacles
                    </button>
                    <button className={`studio-tab ${tab === 'heroes' ? 'active' : ''}`} onClick={() => setTab('heroes')}>
                        Hero Positions
                    </button>
                    <button className={`studio-tab ${tab === 'enemies' ? 'active' : ''}`} onClick={() => setTab('enemies')}>
                        Enemy Spawns
                    </button>
                </div>

                <div className="studio-modal-body grid-editor-body">
                    {tab === 'obstacles' && <ObstaclesTab stage={stage} />}
                    {tab === 'heroes' && <HeroPositionsTab stage={stage} units={units} />}
                    {tab === 'enemies' && <EnemySpawnsTab stage={stage} units={units} />}
                </div>

                <div className="studio-modal-footer">
                    <div style={{ flex: 1 }} />
                    <button className="studio-btn studio-btn-primary" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

// ============= Obstacles =============

const OBSTACLE_TYPES: Array<{ value: ObstacleType; label: string; emoji: string }> = [
    { value: 'block', label: 'Block', emoji: '◼' },
    { value: 'water', label: 'Water', emoji: '≈' },
    { value: 'mountain', label: 'Mountain', emoji: '▲' },
    { value: 'forest', label: 'Forest', emoji: '♣' },
];

type ObstacleTool = ObstacleType | 'eraser';

function ObstaclesTab({ stage }: { stage: Stage }) {
    const [serverRows, setServerRows] = useState<StageObstacle[]>([]);
    const [localMap, setLocalMap] = useState<Map<string, StageObstacle>>(new Map());
    const [tool, setTool] = useState<ObstacleTool>('block');
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await stageObstacleApi.listByStage(stage.id);
            setServerRows(rows);
            const m = new Map<string, StageObstacle>();
            rows.forEach(o => m.set(`${o.col},${o.row}`, o));
            setLocalMap(m);
        } finally {
            setLoading(false);
        }
    }, [stage.id]);
    useEffect(() => { reload(); }, [reload]);

    const getCellData = useCallback((col: number, row: number): CellData | null => {
        const o = localMap.get(`${col},${row}`);
        if (!o) return null;
        const meta = OBSTACLE_TYPES.find(t => t.value === o.obstacle_type);
        return { kind: o.obstacle_type, label: meta?.emoji, title: `(${col}, ${row}) — ${o.obstacle_type}` };
    }, [localMap]);

    const removeAt = useCallback((key: string, existing: StageObstacle) => {
        const next = new Map(localMap);
        next.delete(key);
        setLocalMap(next);
        if (existing.id) {
            setPending(p => p + 1);
            stageObstacleApi.delete(existing.id)
                .catch(e => setError(e?.message || String(e)))
                .finally(() => setPending(p => p - 1));
        }
    }, [localMap]);

    const placeAt = useCallback((key: string, col: number, row: number, type: ObstacleType, existing?: StageObstacle) => {
        const optimistic: StageObstacle = {
            ...(existing ?? {}),
            stage_id: stage.id,
            col, row,
            obstacle_type: type,
        };
        const next = new Map(localMap);
        next.set(key, optimistic);
        setLocalMap(next);

        setPending(p => p + 1);
        stageObstacleApi.save(optimistic)
            .then(saved => {
                setLocalMap(prev => {
                    const m = new Map(prev);
                    const cur = m.get(key);
                    if (cur && cur.obstacle_type === saved.obstacle_type) m.set(key, saved);
                    return m;
                });
            })
            .catch(e => setError(e?.message || String(e)))
            .finally(() => setPending(p => p - 1));
    }, [localMap, stage.id]);

    const handleInteract = useCallback((col: number, row: number, _current: CellData | null, intent: InteractIntent) => {
        const key = `${col},${row}`;
        const existing = localMap.get(key);

        if (tool === 'eraser') {
            if (existing) removeAt(key, existing);
            return;
        }

        // TAP semantics: same-tool tap removes (toggle), different/empty places.
        if (intent === 'tap') {
            if (existing && existing.obstacle_type === tool) {
                removeAt(key, existing);
                return;
            }
            placeAt(key, col, row, tool, existing);
            return;
        }

        // DRAG semantics: always paint with current tool, skip if already that type.
        if (intent === 'drag') {
            if (existing && existing.obstacle_type === tool) return;
            placeAt(key, col, row, tool, existing);
        }
    }, [localMap, tool, removeAt, placeAt]);

    const handleClearAll = useCallback(async () => {
        if (!window.confirm(`Delete all ${serverRows.length} obstacles?`)) return;
        setLocalMap(new Map());
        setPending(p => p + serverRows.length);
        await Promise.all(
            serverRows
                .filter(r => r.id)
                .map(r => stageObstacleApi.delete(r.id!).catch(() => { }))
        );
        setPending(p => Math.max(0, p - serverRows.length));
        await reload();
    }, [serverRows, reload]);

    const placedCount = localMap.size;

    return (
        <div className="grid-editor-layout">
            <div className="grid-editor-side">
                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">Tool</div>
                    <div className="grid-tool-palette">
                        {OBSTACLE_TYPES.map(t => (
                            <button
                                key={t.value}
                                className={`grid-tool ${tool === t.value ? 'active' : ''} tool-${t.value}`}
                                onClick={() => setTool(t.value)}
                            >
                                <span className="grid-tool-emoji">{t.emoji}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                        <button
                            className={`grid-tool ${tool === 'eraser' ? 'active' : ''} tool-eraser`}
                            onClick={() => setTool('eraser')}
                        >
                            <span className="grid-tool-emoji">✕</span>
                            <span>Eraser</span>
                        </button>
                    </div>
                </div>

                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">{placedCount} obstacles</div>
                    <p className="studio-subtle" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        <strong>Tap</strong> to place. <strong>Drag</strong> to paint multiple cells. Use <strong>Eraser</strong> to remove.
                    </p>
                    {pending > 0 && (
                        <div className="grid-pending-indicator">Saving {pending}…</div>
                    )}
                </div>

                <div className="grid-editor-section">
                    <button
                        className="studio-btn studio-btn-ghost"
                        onClick={handleClearAll}
                        disabled={placedCount === 0}
                        style={{ width: '100%' }}
                    >
                        Clear All
                    </button>
                </div>

                {error && <div className="studio-error">⚠ {error}</div>}
            </div>

            <div className="grid-editor-center">
                {loading ? <div className="studio-loading">Loading…</div> : (
                    <GridEditor
                        stage={stage}
                        getCellData={getCellData}
                        onCellInteract={handleInteract}
                        paintOnDrag
                        cursor={tool === 'eraser' ? 'crosshair' : 'crosshair'}
                        toolHint={
                            tool === 'eraser'
                                ? <>Erasing obstacles</>
                                : <>Painting: <strong>{OBSTACLE_TYPES.find(t => t.value === tool)?.label}</strong></>
                        }
                    />
                )}
            </div>
        </div>
    );
}

// ============= Hero Positions =============

function HeroPositionsTab({ stage, units }: { stage: Stage; units: Unit[] }) {
    const [rows, setRows] = useState<StageHeroPosition[]>([]);
    const [obstacles, setObstacles] = useState<StageObstacle[]>([]);
    const [activeSlot, setActiveSlot] = useState(0);
    const [loading, setLoading] = useState(true);
    const busyRef = useRef(false);
    const maxSlots = stage.max_heroes ?? 4;

    const heroes = useMemo(() => units.filter(u => u.unit_type === 'hero').slice(0, maxSlots), [units, maxSlots]);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const [hr, ob] = await Promise.all([
                stageHeroPosApi.listByStage(stage.id),
                stageObstacleApi.listByStage(stage.id),
            ]);
            setRows(hr);
            setObstacles(ob);
        } finally {
            setLoading(false);
        }
    }, [stage.id]);
    useEffect(() => { reload(); }, [reload]);

    const cellMap = useMemo(() => {
        const m = new Map<string, StageHeroPosition>();
        rows.forEach(p => m.set(`${p.spawn_col},${p.spawn_row}`, p));
        return m;
    }, [rows]);

    const obstacleMap = useMemo(() => {
        const m = new Map<string, StageObstacle>();
        obstacles.forEach(o => m.set(`${o.col},${o.row}`, o));
        return m;
    }, [obstacles]);

    const getCellData = useCallback((col: number, row: number): CellData | null => {
        const key = `${col},${row}`;
        const p = cellMap.get(key);
        if (p) {
            const hero = heroes[p.slot_index];
            return {
                kind: 'hero',
                label: `H${p.slot_index}`,
                title: `Slot ${p.slot_index} at (${col}, ${row})${hero ? ' — ' + hero.name : ''}`,
                thumbUrl: hero?.portrait_url ?? undefined,
            };
        }
        const o = obstacleMap.get(key);
        if (o) {
            return {
                kind: o.obstacle_type,
                locked: true,
                lockReason: `Blocked by ${o.obstacle_type} — heroes cannot spawn here`,
            };
        }
        return null;
    }, [cellMap, obstacleMap, heroes]);

    const handleInteract = useCallback(async (col: number, row: number) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try {
            const existing = cellMap.get(`${col},${row}`);
            if (existing) {
                if (existing.id) await stageHeroPosApi.delete(existing.id);
            } else {
                const slotExists = rows.find(r => r.slot_index === activeSlot);
                if (slotExists?.id) await stageHeroPosApi.delete(slotExists.id);
                await stageHeroPosApi.save({
                    stage_id: stage.id,
                    slot_index: activeSlot,
                    spawn_col: col,
                    spawn_row: row,
                });
                setActiveSlot(slot => Math.min(slot + 1, maxSlots - 1));
            }
            await reload();
        } finally {
            busyRef.current = false;
        }
    }, [cellMap, rows, activeSlot, stage.id, maxSlots, reload]);

    const handleClearAll = useCallback(async () => {
        if (!window.confirm(`Delete all ${rows.length} hero positions?`)) return;
        await Promise.all(rows.filter(r => r.id).map(r => stageHeroPosApi.delete(r.id!).catch(() => { })));
        await reload();
    }, [rows, reload]);

    const placedSlots = new Set(rows.map(r => r.slot_index));

    return (
        <div className="grid-editor-layout">
            <div className="grid-editor-side">
                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">Hero slot ({rows.length} / {maxSlots})</div>
                    <div className="grid-tool-palette">
                        {Array.from({ length: maxSlots }).map((_, i) => {
                            const placed = placedSlots.has(i);
                            const hero = heroes[i];
                            return (
                                <button
                                    key={i}
                                    className={`grid-tool tool-hero ${activeSlot === i ? 'active' : ''} ${placed ? 'placed' : ''}`}
                                    onClick={() => setActiveSlot(i)}
                                >
                                    {hero?.portrait_url ? (
                                        <img src={hero.portrait_url} alt="" className="grid-tool-portrait" />
                                    ) : (
                                        <span className="grid-tool-emoji">H{i}</span>
                                    )}
                                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                        <strong>Slot {i}</strong>
                                        <small style={{ opacity: 0.7 }}>{hero?.name ?? (placed ? 'Placed' : 'Empty')}</small>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <p className="studio-subtle" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    Pick a slot, then tap a cell to place. Tap a hero to remove. Re-placing auto-moves the slot.
                </p>
                <button
                    className="studio-btn studio-btn-ghost"
                    onClick={handleClearAll}
                    disabled={rows.length === 0}
                    style={{ width: '100%' }}
                >
                    Clear All
                </button>
            </div>
            <div className="grid-editor-center">
                {loading ? <div className="studio-loading">Loading…</div> : (
                    <GridEditor
                        stage={stage}
                        getCellData={getCellData}
                        onCellInteract={handleInteract}
                        toolHint={<>Placing slot <strong>H{activeSlot}</strong>{heroes[activeSlot] ? ` (${heroes[activeSlot].name})` : ''}</>}
                    />
                )}
            </div>
        </div>
    );
}

// ============= Enemy Spawns =============

const AI_TYPES: Array<{ value: AIType; label: string }> = [
    { value: 'aggressive', label: 'Aggressive' },
    { value: 'defensive', label: 'Defensive' },
    { value: 'patrol', label: 'Patrol' },
];

function buildEnemyOverrideFields(units: Unit[]): FieldDef[] {
    return [
        {
            key: 'unit_id', label: 'Enemy Unit', type: 'select', required: true, width: 'half',
            options: units.filter(u => u.unit_type === 'enemy').map(u => ({ value: u.id, label: `${u.name} (${u.id})` })),
        },
        {
            key: 'ai_type', label: 'AI', type: 'select', width: 'half',
            options: AI_TYPES.map(a => ({ value: a.value, label: a.label })),
        },
        { key: 'spawn_col', label: 'Col', type: 'number', min: 0, max: 5, width: 'half' },
        { key: 'spawn_row', label: 'Row', type: 'number', min: 0, max: 11, width: 'half' },
        { key: 'level_override', label: 'Level Override', type: 'number', min: 1, width: 'third' },
        { key: 'hp_override', label: 'HP Override', type: 'number', min: 1, width: 'third' },
        { key: 'atk_override', label: 'ATK Override', type: 'number', min: 0, width: 'third' },
    ];
}

function EnemySpawnsTab({ stage, units }: { stage: Stage; units: Unit[] }) {
    const [rows, setRows] = useState<(StageEnemySpawn & { units?: Unit })[]>([]);
    const [obstacles, setObstacles] = useState<StageObstacle[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<string>('');
    const [activeAi, setActiveAi] = useState<AIType>('aggressive');
    const [loading, setLoading] = useState(true);
    const busyRef = useRef(false);
    const [editingOverrides, setEditingOverrides] = useState<StageEnemySpawn | null>(null);

    const enemyUnits = useMemo(() => units.filter(u => u.unit_type === 'enemy'), [units]);
    const unitMap = useMemo(() => new Map(units.map(u => [u.id, u])), [units]);

    useEffect(() => {
        if (!activeUnitId && enemyUnits[0]) setActiveUnitId(enemyUnits[0].id);
    }, [enemyUnits, activeUnitId]);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const [es, ob] = await Promise.all([
                stageEnemySpawnApi.listByStage(stage.id),
                stageObstacleApi.listByStage(stage.id),
            ]);
            setRows(es);
            setObstacles(ob);
        } finally {
            setLoading(false);
        }
    }, [stage.id]);
    useEffect(() => { reload(); }, [reload]);

    const cellMap = useMemo(() => {
        const m = new Map<string, StageEnemySpawn & { units?: Unit }>();
        rows.forEach(s => m.set(`${s.spawn_col},${s.spawn_row}`, s));
        return m;
    }, [rows]);

    const obstacleMap = useMemo(() => {
        const m = new Map<string, StageObstacle>();
        obstacles.forEach(o => m.set(`${o.col},${o.row}`, o));
        return m;
    }, [obstacles]);

    const getCellData = useCallback((col: number, row: number): CellData | null => {
        const key = `${col},${row}`;
        const s = cellMap.get(key);
        if (s) {
            const unit = s.units ?? unitMap.get(s.unit_id);
            const name = unit?.name ?? s.unit_id;
            const initial = name?.charAt(0).toUpperCase() || 'E';
            return {
                kind: 'enemy',
                label: initial,
                title: `${name} at (${col}, ${row})`,
                thumbUrl: unit?.portrait_url ?? undefined,
            };
        }
        const o = obstacleMap.get(key);
        if (o) {
            return {
                kind: o.obstacle_type,
                locked: true,
                lockReason: `Blocked by ${o.obstacle_type} — enemies cannot spawn here`,
            };
        }
        return null;
    }, [cellMap, obstacleMap, unitMap]);

    const handleInteract = useCallback(async (col: number, row: number) => {
        if (busyRef.current) return;
        const existing = cellMap.get(`${col},${row}`);
        if (existing) {
            setEditingOverrides(existing);
            return;
        }
        if (!activeUnitId) return;
        busyRef.current = true;
        try {
            await stageEnemySpawnApi.save({
                stage_id: stage.id,
                unit_id: activeUnitId,
                spawn_col: col,
                spawn_row: row,
                ai_type: activeAi,
            });
            await reload();
        } finally {
            busyRef.current = false;
        }
    }, [cellMap, activeUnitId, activeAi, stage.id, reload]);

    const handleClearAll = useCallback(async () => {
        if (!window.confirm(`Delete all ${rows.length} enemy spawns?`)) return;
        await Promise.all(rows.filter(r => r.id).map(r => stageEnemySpawnApi.delete(r.id!).catch(() => { })));
        await reload();
    }, [rows, reload]);

    const activeUnit = enemyUnits.find(u => u.id === activeUnitId);

    return (
        <div className="grid-editor-layout">
            <div className="grid-editor-side">
                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">Enemy unit</div>
                    <div className="grid-tool-palette grid-unit-grid">
                        {enemyUnits.map(u => (
                            <button
                                key={u.id}
                                className={`grid-tool tool-unit ${activeUnitId === u.id ? 'active' : ''}`}
                                onClick={() => setActiveUnitId(u.id)}
                                title={u.name}
                            >
                                {u.portrait_url ? (
                                    <img src={u.portrait_url} alt="" className="grid-tool-portrait" />
                                ) : (
                                    <span className="grid-tool-emoji">{u.name.charAt(0)}</span>
                                )}
                                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
                                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</strong>
                                    <small style={{ opacity: 0.7 }}>Lv {u.level} · {u.base_hp} HP</small>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">AI behavior</div>
                    <div className="grid-tool-palette">
                        {AI_TYPES.map(a => (
                            <button
                                key={a.value}
                                className={`grid-tool ${activeAi === a.value ? 'active' : ''}`}
                                onClick={() => setActiveAi(a.value)}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid-editor-section">
                    <div className="grid-editor-section-title">{rows.length} enemies placed</div>
                    <p className="studio-subtle" style={{ fontSize: 12, lineHeight: 1.5 }}>
                        Tap empty cell to place. Tap an enemy to edit overrides (level/HP/ATK).
                    </p>
                </div>

                <button
                    className="studio-btn studio-btn-ghost"
                    onClick={handleClearAll}
                    disabled={rows.length === 0}
                    style={{ width: '100%' }}
                >
                    Clear All
                </button>
            </div>

            <div className="grid-editor-center">
                {loading ? <div className="studio-loading">Loading…</div> : (
                    <GridEditor
                        stage={stage}
                        getCellData={getCellData}
                        onCellInteract={handleInteract}
                        toolHint={
                            activeUnit
                                ? <>Placing: <strong>{activeUnit.name}</strong> ({activeAi})</>
                                : <span style={{ color: '#ec9d83' }}>Select an enemy unit first</span>
                        }
                    />
                )}
            </div>

            {editingOverrides && (
                <EntityEditor<StageEnemySpawn>
                    title="Edit Enemy Overrides"
                    open={true}
                    initial={editingOverrides}
                    fields={buildEnemyOverrideFields(units)}
                    isEdit
                    onClose={() => setEditingOverrides(null)}
                    onSave={async v => { await stageEnemySpawnApi.save({ ...v, stage_id: stage.id }); reload(); }}
                    onDelete={editingOverrides.id ? async () => { await stageEnemySpawnApi.delete(editingOverrides.id!); reload(); } : undefined}
                    sidePreview={(values) => {
                        const u = unitMap.get(values.unit_id);
                        return <SpritePreview url={u?.sprite_url} />;
                    }}
                />
            )}
        </div>
    );
}
