// Main menu — Octopath Traveler-inspired title screen.
// Shown before the player enters the battlefield.

import { useEffect, useState, useCallback } from 'react';
// @ts-ignore — JS module
import { Haptics, ImpactStyle } from '../game/utils/haptics.js';
import { audio } from '../game/audio/AudioManager';
import SettingsModal from './SettingsModal';

interface MenuItem {
    id: string;
    label: string;
    sublabel?: string;
    enabled: boolean;
    onSelect: () => void;
}

interface MainMenuProps {
    onStartBattle: () => void;
}

const APP_VERSION = '0.1.0';

const MainMenu: React.FC<MainMenuProps> = ({ onStartBattle }) => {
    const [exiting, setExiting] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Start menu BGM (deferred until first user gesture by AudioManager)
    useEffect(() => {
        audio.playBgm('menu');
        return () => { /* keep playing — Game will crossfade */ };
    }, []);

    const items: MenuItem[] = [
        {
            id: 'battle',
            label: 'Start Battle',
            sublabel: 'Battlefield #1',
            enabled: true,
            onSelect: () => {
                Haptics.impact(ImpactStyle.Medium);
                audio.playSfx('menuConfirm');
                setExiting(true);
                setTimeout(() => onStartBattle(), 480);
            },
        },
        {
            id: 'continue',
            label: 'Continue',
            sublabel: 'No save data',
            enabled: false,
            onSelect: () => { },
        },
        {
            id: 'settings',
            label: 'Settings',
            sublabel: 'Audio · controls',
            enabled: true,
            onSelect: () => {
                Haptics.impact(ImpactStyle.Light);
                audio.playSfx('uiTap');
                setSettingsOpen(true);
            },
        },
        {
            id: 'credits',
            label: 'Credits',
            sublabel: 'Genoflow Demo',
            enabled: false,
            onSelect: () => { },
        },
    ];

    const handleHover = useCallback((idx: number) => {
        if (!items[idx]?.enabled) return;
        if (idx !== activeIdx) audio.playSfx('uiHover');
        setActiveIdx(idx);
    }, [items, activeIdx]);

    // Allow keyboard nav for desktop testing
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (exiting) return;
            if (e.key === 'ArrowDown') {
                setActiveIdx(i => {
                    let next = (i + 1) % items.length;
                    while (!items[next].enabled && next !== i) {
                        next = (next + 1) % items.length;
                    }
                    return next;
                });
                Haptics.impact(ImpactStyle.Light);
            } else if (e.key === 'ArrowUp') {
                setActiveIdx(i => {
                    let next = (i - 1 + items.length) % items.length;
                    while (!items[next].enabled && next !== i) {
                        next = (next - 1 + items.length) % items.length;
                    }
                    return next;
                });
                Haptics.impact(ImpactStyle.Light);
            } else if (e.key === 'Enter' || e.key === ' ') {
                items[activeIdx]?.onSelect();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [items, activeIdx, exiting]);

    return (
        <div className={`mm-root ${exiting ? 'mm-exiting' : ''}`}>
            {/* Dark gradient background with bg image */}
            <div
                className="mm-bg"
                style={{
                    backgroundImage: 'url(assets/battle-grass.png)',
                }}
            />

            {/* Atmospheric mist drifting horizontally */}
            <div className="mm-mist mm-mist-1" aria-hidden="true" />
            <div className="mm-mist mm-mist-2" aria-hidden="true" />

            {/* Volumetric god-rays from top */}
            <div className="mm-godrays" aria-hidden="true">
                <span className="mm-ray mm-ray-1" />
                <span className="mm-ray mm-ray-2" />
                <span className="mm-ray mm-ray-3" />
            </div>

            {/* Warm horizon glow pulsing */}
            <div className="mm-horizon" aria-hidden="true" />

            <div className="mm-vignette" />

            {/* Floating gold particles + larger glowing orbs */}
            <div className="mm-stars" aria-hidden="true">
                {Array.from({ length: 22 }).map((_, i) => (
                    <span key={i} className={`mm-star mm-star-${i % 4}`} style={{
                        left: `${(i * 17 + 7) % 95}%`,
                        top: `${(i * 23 + 13) % 90}%`,
                        animationDelay: `${(i * 0.4) % 6}s`,
                    }} />
                ))}
            </div>

            {/* Rising embers (warm sparks drifting up) */}
            <div className="mm-embers" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="mm-ember" style={{
                        left: `${(i * 31 + 5) % 100}%`,
                        animationDelay: `${(i * 0.7) % 8}s`,
                        animationDuration: `${10 + (i % 4) * 2}s`,
                    }} />
                ))}
            </div>

            {/* Content */}
            <div className="mm-content">
                <div className="mm-title-block">
                    <div className="mm-decor mm-decor-top" aria-hidden="true" />
                    <h1 className="mm-title">
                        <span className="mm-title-line">Fire Emblem</span>
                        <span className="mm-title-line mm-title-line-2">Canvas</span>
                    </h1>
                    <div className="mm-subtitle">A turn-based tactics battle</div>
                    <div className="mm-decor mm-decor-bottom" aria-hidden="true" />
                </div>

                <nav className="mm-menu" aria-label="Main menu">
                    {items.map((item, i) => (
                        <button
                            key={item.id}
                            type="button"
                            disabled={!item.enabled || exiting}
                            className={`mm-item ${activeIdx === i ? 'active' : ''} ${!item.enabled ? 'disabled' : ''}`}
                            onMouseEnter={() => handleHover(i)}
                            onFocus={() => handleHover(i)}
                            onClick={() => {
                                if (!item.enabled) return;
                                handleHover(i);
                                item.onSelect();
                            }}
                            style={{ animationDelay: `${0.45 + i * 0.08}s` }}
                        >
                            <span className="mm-item-chevron" aria-hidden="true">▸</span>
                            <span className="mm-item-text">
                                <span className="mm-item-label">{item.label}</span>
                                {item.sublabel && <span className="mm-item-sub">{item.sublabel}</span>}
                            </span>
                            <span className="mm-item-gem" aria-hidden="true">◆</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mm-footer">
                <span className="mm-version">v{APP_VERSION}</span>
                <span className="mm-tag">Genoflow Demo</span>
            </div>

            <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};

export default MainMenu;
