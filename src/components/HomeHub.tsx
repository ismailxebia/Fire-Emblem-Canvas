// Home Hub — Fire Emblem Heroes-inspired lobby/home screen.
// Replaces the simple title screen. Player lands here before entering battle.

import { useEffect, useMemo, useState, useCallback } from 'react';
// @ts-ignore — JS module
import { Haptics, ImpactStyle } from '../game/utils/haptics.js';
import { audio } from '../game/audio/AudioManager';
import SettingsModal from './SettingsModal';
import StageSelect, { type StageEntry } from './StageSelect';
import heroesData from '../game/data/heroes.json';

interface HomeHubProps {
    onStartBattle: () => void;
}

interface HeroCard {
    id: string;
    name: string;
    spriteUrl: string;
}

type Tab = 'home' | 'battle' | 'allies' | 'summon' | 'shop' | 'misc';

const APP_VERSION = '0.1.0';
const STAMINA_MAX = 99;
const STAMINA_CURRENT = 87;

// Sprite sheet: 4 frames per row × 4 rows; frame is 256×240. Idle row = 0.
const FRAME_W = 256;
const FRAME_H = 240;
const IDLE_FRAMES = 4;

const HEROES: HeroCard[] = (heroesData as any[]).map(h => ({
    id: h.id,
    name: h.name,
    spriteUrl: h.spriteUrl,
}));

// Five formation slots arranged with depth (percentages of stage container).
// Slot 0 = leader, prominent up-front. Slots 1-2 = mid flanks. Slots 3-4 = back row.
const FORMATION: { x: number; y: number; scale: number; z: number }[] = [
    { x: 50, y: 82, scale: 1.0,  z: 5 },
    { x: 22, y: 66, scale: 0.78, z: 4 },
    { x: 78, y: 66, scale: 0.78, z: 4 },
    { x: 14, y: 48, scale: 0.62, z: 3 },
    { x: 86, y: 48, scale: 0.62, z: 3 },
];

interface FormationSlotProps {
    hero: HeroCard | null;
    slot: typeof FORMATION[number];
}

const FormationSlot: React.FC<FormationSlotProps> = ({ hero, slot }) => {
    const baseW = 138;
    const baseH = baseW * (FRAME_H / FRAME_W);
    const renderW = baseW * slot.scale;
    const renderH = baseH * slot.scale;

    return (
        <div
            className={`hub-slot ${hero ? 'has-hero' : 'is-empty'}`}
            style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                zIndex: slot.z,
                ['--slot-w' as any]: `${renderW}px`,
                ['--slot-h' as any]: `${renderH}px`,
            }}
            aria-hidden={!hero}
        >
            <span className="hub-slot-pedestal" aria-hidden="true" />
            {hero ? (
                <span
                    className="hub-slot-sprite"
                    style={{
                        // CSS url() breaks on unescaped parens; quote the URL so chars like
                        // "(2)" inside the path don't terminate the function early.
                        backgroundImage: `url("${hero.spriteUrl}")`,
                        backgroundSize: `${renderW * IDLE_FRAMES}px auto`,
                    }}
                    aria-hidden="true"
                />
            ) : (
                <span className="hub-slot-empty" aria-hidden="true">＋</span>
            )}
        </div>
    );
};

const HomeHub: React.FC<HomeHubProps> = ({ onStartBattle }) => {
    const [exiting, setExiting] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [stageSelectOpen, setStageSelectOpen] = useState(false);
    const [tab, setTab] = useState<Tab>('home');
    const [toast, setToast] = useState<string | null>(null);

    const formationHeroes: (HeroCard | null)[] = useMemo(() => {
        const arr: (HeroCard | null)[] = new Array(5).fill(null);
        HEROES.forEach((h, i) => { if (i < 5) arr[i] = h; });
        return arr;
    }, []);

    useEffect(() => {
        audio.playBgm('menu');
    }, []);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 1800);
    }, []);

    const onTabClick = useCallback((next: Tab, action?: () => void) => {
        Haptics.impact(ImpactStyle.Light);
        audio.playSfx('uiTap');
        setTab(next);
        action?.();
    }, []);

    const onBattleClick = useCallback(() => {
        Haptics.impact(ImpactStyle.Light);
        audio.playSfx('uiTap');
        setTab('battle');
        setStageSelectOpen(true);
    }, []);

    const onStageSelected = useCallback((_stage: StageEntry) => {
        setStageSelectOpen(false);
        setExiting(true);
        // Small delay so the sheet's close transition + fade-out can play before
        // the game canvas mounts.
        window.setTimeout(() => onStartBattle(), 480);
    }, [onStartBattle]);

    return (
        <div className={`hub-root ${exiting ? 'hub-exiting' : ''}`}>
            <div className="hub-bg" style={{ backgroundImage: 'url(assets/battle-grass.png)' }} />
            <div className="hub-mist hub-mist-1" aria-hidden="true" />
            <div className="hub-mist hub-mist-2" aria-hidden="true" />
            <div className="hub-godrays" aria-hidden="true">
                <span className="hub-ray hub-ray-1" />
                <span className="hub-ray hub-ray-2" />
                <span className="hub-ray hub-ray-3" />
            </div>
            <div className="hub-vignette" aria-hidden="true" />

            <header className="hub-topbar">
                <div className="hub-brand">
                    <span className="hub-brand-mark">◆</span>
                    <div className="hub-brand-text">
                        <span className="hub-brand-line1">Fire Emblem</span>
                        <span className="hub-brand-line2">Canvas</span>
                    </div>
                </div>

                <div className="hub-currencies">
                    <div className="hub-currency hub-currency-orb">
                        <span className="hub-currency-icon">◈</span>
                        <span className="hub-currency-val">142</span>
                        <span className="hub-currency-add">+</span>
                    </div>
                    <div className="hub-currency hub-currency-gold">
                        <span className="hub-currency-icon">●</span>
                        <span className="hub-currency-val">8,420</span>
                    </div>
                    <div className="hub-currency hub-currency-shard">
                        <span className="hub-currency-icon">✦</span>
                        <span className="hub-currency-val">36</span>
                    </div>
                </div>
            </header>

            <div className="hub-stamina">
                <span className="hub-stamina-icon">⟁</span>
                <div className="hub-stamina-track">
                    <div className="hub-stamina-fill" style={{ width: `${(STAMINA_CURRENT / STAMINA_MAX) * 100}%` }} />
                </div>
                <span className="hub-stamina-text">{STAMINA_CURRENT}<span className="hub-stamina-max">/{STAMINA_MAX}</span></span>
            </div>

            <main className="hub-stage">
                <div className="hub-formation" aria-label="Hero formation">
                    <div className="hub-formation-floor" aria-hidden="true" />
                    {formationHeroes.map((hero, i) => (
                        <FormationSlot key={i} hero={hero} slot={FORMATION[i]} />
                    ))}
                </div>
            </main>

            <nav className="hub-nav" aria-label="Main navigation">
                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'home' ? 'active' : ''}`}
                    onClick={() => onTabClick('home')}
                >
                    <span className="hub-nav-icon">⌂</span>
                    <span className="hub-nav-label">Home</span>
                </button>

                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'battle' ? 'active' : ''}`}
                    onClick={onBattleClick}
                    disabled={exiting}
                >
                    <span className="hub-nav-icon">⚔</span>
                    <span className="hub-nav-label">Battle</span>
                </button>

                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'allies' ? 'active' : ''}`}
                    onClick={() => onTabClick('allies', () => showToast('Allies — coming soon'))}
                >
                    <span className="hub-nav-icon">⚑</span>
                    <span className="hub-nav-label">Allies</span>
                </button>

                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'summon' ? 'active' : ''}`}
                    onClick={() => onTabClick('summon', () => showToast('Summon — coming soon'))}
                >
                    <span className="hub-nav-icon">✦</span>
                    <span className="hub-nav-label">Summon</span>
                </button>

                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'shop' ? 'active' : ''}`}
                    onClick={() => onTabClick('shop', () => showToast('Shop — coming soon'))}
                >
                    <span className="hub-nav-icon">⛨</span>
                    <span className="hub-nav-label">Shop</span>
                </button>

                <button
                    type="button"
                    className={`hub-nav-btn ${tab === 'misc' ? 'active' : ''}`}
                    onClick={() => onTabClick('misc', () => setSettingsOpen(true))}
                >
                    <span className="hub-nav-icon">⋯</span>
                    <span className="hub-nav-label">Misc</span>
                </button>
            </nav>

            <div className="hub-footer">
                <span className="hub-version">v{APP_VERSION}</span>
                <span className="hub-tag">Genoflow Demo</span>
            </div>

            {toast && <div className="hub-toast">{toast}</div>}

            <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <StageSelect
                open={stageSelectOpen}
                onClose={() => setStageSelectOpen(false)}
                onSelect={onStageSelected}
            />
        </div>
    );
};

export default HomeHub;
