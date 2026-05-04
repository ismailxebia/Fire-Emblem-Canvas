// Stage select panel — opened from the Battle button on HomeHub.
// Shows a list of available battlefields. Player picks one to start the game.

import { useEffect } from 'react';
// @ts-ignore — JS module
import { Haptics, ImpactStyle } from '../game/utils/haptics.js';
import { audio } from '../game/audio/AudioManager';

export interface StageEntry {
    id: string;
    num: number;
    name: string;
    sub: string;
    diff: number;       // 1..5
    stamina: number;
    locked: boolean;
    boss?: boolean;
    bgUrl?: string;
}

export const STAGES: StageEntry[] = [
    {
        id: 'stage01',
        num: 1,
        name: 'Battle of Armageddon',
        sub: 'Verdant Plains',
        diff: 1,
        stamina: 8,
        locked: false,
        bgUrl: 'https://ik.imagekit.io/ij05ikv7z/Hero/HD%20Back.png',
    },
    { id: 'stage02', num: 2, name: 'Frostpeak Outpost',  sub: 'Snowy Mountains', diff: 2, stamina: 10, locked: true },
    { id: 'stage03', num: 3, name: 'Ember Hollow',       sub: 'Volcanic Cave',   diff: 3, stamina: 12, locked: true },
    { id: 'stage04', num: 4, name: 'Whispering Woods',   sub: 'Ancient Forest',  diff: 3, stamina: 14, locked: true },
    { id: 'stage05', num: 5, name: 'The Shattered Spire', sub: 'Boss Battle',    diff: 5, stamina: 20, locked: true, boss: true },
];

interface StageSelectProps {
    open: boolean;
    onClose: () => void;
    onSelect: (stage: StageEntry) => void;
}

const StageSelect: React.FC<StageSelectProps> = ({ open, onClose, onSelect }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const handlePick = (s: StageEntry) => {
        if (s.locked) {
            audio.playSfx('uiCancel');
            Haptics.impact(ImpactStyle.Light);
            return;
        }
        Haptics.impact(ImpactStyle.Medium);
        audio.playSfx('menuConfirm');
        onSelect(s);
    };

    return (
        <div className="stage-overlay" onClick={onClose}>
            <div className="stage-sheet" onClick={e => e.stopPropagation()}>
                <div className="stage-handle" aria-hidden="true" />

                <header className="stage-head">
                    <div className="stage-head-text">
                        <span className="stage-head-kicker">Battle</span>
                        <h2 className="stage-head-title">Select Battlefield</h2>
                    </div>
                    <button
                        type="button"
                        className="stage-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </header>

                <div className="stage-list" role="list">
                    {STAGES.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            role="listitem"
                            className={`stage-card ${s.locked ? 'locked' : ''} ${s.boss ? 'boss' : ''}`}
                            onClick={() => handlePick(s)}
                            disabled={s.locked}
                        >
                            <div
                                className="stage-card-bg"
                                style={{
                                    backgroundImage: s.bgUrl ? `url("${s.bgUrl}")` : undefined,
                                }}
                                aria-hidden="true"
                            />
                            <div className="stage-card-shade" aria-hidden="true" />

                            <div className="stage-card-num" aria-hidden="true">
                                <span className="stage-card-num-label">CH</span>
                                <span className="stage-card-num-val">{String(s.num).padStart(2, '0')}</span>
                            </div>

                            <div className="stage-card-body">
                                <div className="stage-card-sub">{s.sub}</div>
                                <div className="stage-card-name">{s.name}</div>
                                <div className="stage-card-meta">
                                    <span className="stage-diff" aria-label={`Difficulty ${s.diff} of 5`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={`stage-diff-pip ${i < s.diff ? 'on' : ''}`}>★</span>
                                        ))}
                                    </span>
                                    <span className="stage-stamina">
                                        <span className="stage-stamina-icon">⟁</span>{s.stamina}
                                    </span>
                                </div>
                            </div>

                            {s.locked ? (
                                <div className="stage-card-lock" aria-hidden="true">
                                    <span className="stage-lock-icon">⛌</span>
                                    <span className="stage-lock-text">Locked</span>
                                </div>
                            ) : (
                                <div className="stage-card-go" aria-hidden="true">
                                    <span className="stage-go-arrow">▸</span>
                                </div>
                            )}

                            {s.boss && <span className="stage-card-tag">BOSS</span>}
                        </button>
                    ))}
                </div>

                <button type="button" className="stage-back" onClick={onClose}>← Back</button>
            </div>
        </div>
    );
};

export default StageSelect;
