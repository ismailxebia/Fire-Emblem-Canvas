// Allies panel — hero roster, opened from the Allies nav button on HomeHub.
// Shows all owned heroes as a grid of cards. Empty slots = "recruit a hero" tease.

import { useEffect, useState } from 'react';
import { audio } from '../game/audio/AudioManager';
import heroesData from '../game/data/heroes.json';
import { updatePlayerUnitFormation } from '../lib/supabase';


interface AlliesPanelProps {
    open: boolean;
    onClose: () => void;
}

interface HeroEntry {
    id: string;
    name: string;
    level: number;
    star: number;
    hp: number;
    atk: number;
    def: number;
    spd: number;
    res: number;
    spriteUrl: string;
    portraitUrl: string;
    magicSkill: string;
    attackRange: number;
}

const ROSTER: HeroEntry[] = heroesData as HeroEntry[];
const TOTAL_SLOTS = 12;

const ROLE_BY_RANGE = (range: number): { label: string; color: string } => {
    if (range >= 3) return { label: 'Mage',   color: '#c89bff' };
    if (range === 2) return { label: 'Bow',   color: '#9bb8ff' };
    return { label: 'Sword', color: '#ff9b6e' };
};

const AlliesPanel: React.FC<AlliesPanelProps> = ({ open, onClose }) => {
    const [formation, setFormation] = useState<(string | null)[]>([null, null, null, null]);

    // Dummy player ID for demo, usually from auth context
    const playerId = '00000000-0000-0000-0000-000000000000';

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const filledCount = ROSTER.length;
    const emptySlots = Math.max(0, TOTAL_SLOTS - filledCount);

    return (
        <div className="panel-overlay" onClick={onClose}>
            <div className="panel-sheet allies-sheet" onClick={e => e.stopPropagation()}>
                <div className="stage-handle" aria-hidden="true" />

                <header className="stage-head">
                    <div className="stage-head-text">
                        <span className="stage-head-kicker">Roster</span>
                        <h2 className="stage-head-title">Allies</h2>
                    </div>
                    <button
                        type="button"
                        className="stage-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </header>

                <div className="allies-summary">
                    <div className="allies-summary-stat">
                        <span className="allies-summary-val">{filledCount}</span>
                        <span className="allies-summary-label">Heroes</span>
                    </div>
                    <div className="allies-summary-divider" aria-hidden="true" />
                    <div className="allies-summary-stat">
                        <span className="allies-summary-val">{TOTAL_SLOTS}</span>
                        <span className="allies-summary-label">Slots</span>
                    </div>
                    <div className="allies-summary-divider" aria-hidden="true" />
                    <div className="allies-summary-stat">
                        <span className="allies-summary-val">
                            {ROSTER.reduce((sum, h) => sum + (h.star ?? 0), 0)}
                        </span>
                        <span className="allies-summary-label">★ Total</span>
                    </div>
                </div>

                <div className="formation-section" style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{ margin: 0, color: '#ff9b6e', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Formation</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Select up to 4 heroes to bring into battle.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {formation.map((heroId, index) => {
                            const hero = heroId ? ROSTER.find(h => h.id === heroId) : null;
                            return (
                                <div 
                                    key={index} 
                                    className="formation-slot" 
                                    style={{ 
                                        width: '60px', height: '60px', borderRadius: '8px', 
                                        border: hero ? '2px solid #ff9b6e' : '2px dashed #444', 
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        backgroundColor: '#1a1a1a', cursor: hero ? 'pointer' : 'default',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => {
                                        if (hero) {
                                            audio.playSfx('uiHover');
                                            const newFormation = [...formation];
                                            newFormation[index] = null;
                                            setFormation(newFormation);
                                            updatePlayerUnitFormation(playerId, hero.id, null);
                                        }
                                    }}
                                >
                                    {hero ? <img src={hero.portraitUrl} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#444' }}>{index + 1}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="allies-grid">
                    {ROSTER.map(h => {
                        const role = ROLE_BY_RANGE(h.attackRange);
                        const isSelected = formation.includes(h.id);
                        return (
                            <button
                                key={h.id}
                                type="button"
                                className="ally-card"
                                onClick={() => {
                                    audio.playSfx('uiHover');
                                    if (isSelected) {
                                        const idx = formation.indexOf(h.id);
                                        const newForm = [...formation];
                                        newForm[idx] = null;
                                        setFormation(newForm);
                                        updatePlayerUnitFormation(playerId, h.id, null);
                                    } else {
                                        const emptyIdx = formation.indexOf(null);
                                        if (emptyIdx !== -1) {
                                            const newForm = [...formation];
                                            newForm[emptyIdx] = h.id;
                                            setFormation(newForm);
                                            // 1-indexed for the DB slot if we want
                                            updatePlayerUnitFormation(playerId, h.id, emptyIdx + 1);
                                        }
                                    }
                                }}
                                style={{ 
                                    ['--theme' as any]: role.color,
                                    border: isSelected ? `2px solid ${role.color}` : 'none',
                                    opacity: isSelected ? 0.7 : 1
                                }}
                            >
                                <div className="ally-card-portrait">
                                    <img
                                        src={h.portraitUrl}
                                        alt={h.name}
                                        className="ally-card-img"
                                        draggable={false}
                                    />
                                    <span className="ally-card-role" aria-label={`Role: ${role.label}`}>
                                        {role.label}
                                    </span>
                                </div>

                                <div className="ally-card-info">
                                    <div className="ally-card-stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={`ally-star ${i < (h.star ?? 0) ? 'on' : ''}`}>★</span>
                                        ))}
                                    </div>
                                    <div className="ally-card-name">{h.name}</div>
                                    <div className="ally-card-meta">
                                        <span className="ally-lv">Lv {h.level}</span>
                                        <span className="ally-hp" title="HP">HP {h.hp}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {Array.from({ length: emptySlots }).map((_, i) => (
                        <div key={`empty-${i}`} className="ally-card ally-card-empty" aria-hidden="true">
                            <div className="ally-empty-icon">＋</div>
                            <div className="ally-empty-label">Empty</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AlliesPanel;
