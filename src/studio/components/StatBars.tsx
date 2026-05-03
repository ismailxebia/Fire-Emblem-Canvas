// Compact 5-stat visual: mini bars sized relative to a max scale.
// Designed to read at a glance without taking column space.

interface StatBarsProps {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    res: number;
    /** Max value used to scale bar widths. Defaults to 200 (game upper bound) */
    max?: number;
}

const STATS_META: Array<{ key: 'hp' | 'atk' | 'def' | 'spd' | 'res'; label: string; color: string }> = [
    { key: 'hp', label: 'HP', color: '#14ae5c' },
    { key: 'atk', label: 'AT', color: '#e93d44' },
    { key: 'def', label: 'DF', color: '#7b61ff' },
    { key: 'spd', label: 'SP', color: '#0d99ff' },
    { key: 'res', label: 'RS', color: '#f5a623' },
];

export function StatBars({ hp, atk, def, spd, res, max = 200 }: StatBarsProps) {
    const values: Record<string, number> = { hp, atk, def, spd, res };
    return (
        <div className="stat-bars">
            {STATS_META.map(s => {
                const value = values[s.key] ?? 0;
                const pct = Math.min(100, (value / max) * 100);
                return (
                    <div key={s.key} className="stat-bar-cell" title={`${s.label}: ${value}`}>
                        <span className="stat-bar-label" style={{ color: s.color }}>{s.label}</span>
                        <div className="stat-bar-track">
                            <div
                                className="stat-bar-fill"
                                style={{ width: `${pct}%`, background: s.color }}
                            />
                        </div>
                        <span className="stat-bar-value">{value}</span>
                    </div>
                );
            })}
        </div>
    );
}
