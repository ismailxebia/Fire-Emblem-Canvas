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
    diff: number;
    stamina: number;
    locked: boolean;
    boss?: boolean;
    bgUrl?: string;
    /** Stage theme tint — used for accent stripe + colored gradient wash */
    theme: string;
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
        theme: '#7ad6a8',
    },
    { id: 'stage02', num: 2, name: 'Frostpeak Outpost',   sub: 'Snowy Mountains', diff: 2, stamina: 10, locked: true, theme: '#9bb8ff' },
    { id: 'stage03', num: 3, name: 'Ember Hollow',        sub: 'Volcanic Cave',   diff: 3, stamina: 12, locked: true, theme: '#ff9b6e' },
    { id: 'stage04', num: 4, name: 'Whispering Woods',    sub: 'Ancient Forest',  diff: 3, stamina: 14, locked: true, theme: '#c89bff' },
    { id: 'stage05', num: 5, name: 'The Shattered Spire', sub: 'Boss Battle',     diff: 5, stamina: 20, locked: true, boss: true, theme: '#ff7a6e' },
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
                            style={{ ['--theme' as any]: s.theme }}
                        >
                            <span className="stage-card-accent" aria-hidden="true" />

                            {s.bgUrl && (
                                <span
                                    className="stage-card-thumb"
                                    style={{ backgroundImage: `url("${s.bgUrl}")` }}
                                    aria-hidden="true"
                                />
                            )}

                            <span className="stage-card-badge" aria-hidden="true">
                                <span className="stage-card-badge-kicker">CH</span>
                                <span className="stage-card-badge-num">{String(s.num).padStart(2, '0')}</span>
                            </span>

                            <span className="stage-card-body">
                                <span className="stage-card-sub">{s.sub}</span>
                                <span className="stage-card-name">{s.name}</span>
                                <span className="stage-card-meta">
                                    <span className="stage-diff" aria-label={`Difficulty ${s.diff} of 5`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={`stage-diff-pip ${i < s.diff ? 'on' : ''}`}>★</span>
                                        ))}
                                    </span>
                                    <span className="stage-stamina">
                                        <span className="stage-stamina-icon">⟁</span>{s.stamina}
                                    </span>
                                </span>
                            </span>

                            <span className={`stage-card-cta ${s.locked ? 'locked' : ''}`} aria-hidden="true">
                                {s.locked ? '⛌' : '▸'}
                            </span>

                            {s.boss && <span className="stage-card-tag">BOSS</span>}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default StageSelect;
