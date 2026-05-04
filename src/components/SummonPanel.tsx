// Summon panel — banner/gacha placeholder. Currently a template; rates &
// pull mechanics aren't wired up yet.

import { useEffect, useState } from 'react';
// @ts-ignore — JS module
import { Haptics, ImpactStyle } from '../game/utils/haptics.js';
import { audio } from '../game/audio/AudioManager';

interface SummonPanelProps {
    open: boolean;
    onClose: () => void;
}

interface BannerEntry {
    id: string;
    title: string;
    sub: string;
    accent: string;
    featuredName: string;
    featuredArt: string;
    rateUp: string;
    timeLeft: string;
}

const BANNERS: BannerEntry[] = [
    {
        id: 'banner-flame',
        title: 'Tactician\'s Calling',
        sub: 'Featured · Limited',
        accent: '#ff9b6e',
        featuredName: 'Leonardo',
        featuredArt: 'https://ik.imagekit.io/ij05ikv7z/Hero/pot-orlandeau.png',
        rateUp: '5★ rate up: 6%',
        timeLeft: '12d 14h left',
    },
    {
        id: 'banner-arcana',
        title: 'Arcane Awakening',
        sub: 'Featured · Mage Pool',
        accent: '#c89bff',
        featuredName: 'Da Vinci',
        featuredArt: 'https://ik.imagekit.io/ij05ikv7z/Hero/pot-unit.png',
        rateUp: '5★ rate up: 4%',
        timeLeft: '5d 02h left',
    },
];

const SummonPanel: React.FC<SummonPanelProps> = ({ open, onClose }) => {
    const [bannerIdx, setBannerIdx] = useState(0);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const banner = BANNERS[bannerIdx];

    const cyclePull = (count: number) => {
        Haptics.impact(ImpactStyle.Medium);
        audio.playSfx('uiCancel');
        // Placeholder — no real summon system yet.
        // Visual feedback only via SFX + haptics.
        void count;
    };

    return (
        <div className="panel-overlay" onClick={onClose}>
            <div className="panel-sheet summon-sheet" onClick={e => e.stopPropagation()}>
                <div className="stage-handle" aria-hidden="true" />

                <header className="stage-head">
                    <div className="stage-head-text">
                        <span className="stage-head-kicker">Gacha</span>
                        <h2 className="stage-head-title">Summon</h2>
                    </div>
                    <button
                        type="button"
                        className="stage-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </header>

                {/* Banner showcase */}
                <article
                    className="summon-banner"
                    style={{ ['--theme' as any]: banner.accent }}
                >
                    <div className="summon-banner-glow" aria-hidden="true" />
                    <img
                        src={banner.featuredArt}
                        alt={banner.featuredName}
                        className="summon-banner-art"
                        draggable={false}
                    />
                    <div className="summon-banner-info">
                        <div className="summon-banner-sub">{banner.sub}</div>
                        <div className="summon-banner-title">{banner.title}</div>
                        <div className="summon-banner-feat">
                            <span className="summon-banner-feat-label">Featured</span>
                            <span className="summon-banner-feat-name">{banner.featuredName}</span>
                        </div>
                        <div className="summon-banner-meta">
                            <span className="summon-banner-rate">{banner.rateUp}</span>
                            <span className="summon-banner-time">{banner.timeLeft}</span>
                        </div>
                    </div>
                </article>

                {/* Banner pagination */}
                <div className="summon-dots" role="tablist" aria-label="Banners">
                    {BANNERS.map((b, i) => (
                        <button
                            key={b.id}
                            type="button"
                            className={`summon-dot ${i === bannerIdx ? 'active' : ''}`}
                            onClick={() => { setBannerIdx(i); audio.playSfx('uiHover'); }}
                            aria-label={`Banner ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Pull buttons */}
                <div className="summon-actions">
                    <button
                        type="button"
                        className="summon-btn summon-btn-single"
                        onClick={() => cyclePull(1)}
                    >
                        <span className="summon-btn-label">Summon</span>
                        <span className="summon-btn-cost">
                            <span className="summon-btn-cost-icon">◈</span>
                            <span>5</span>
                        </span>
                        <span className="summon-btn-x">×1</span>
                    </button>

                    <button
                        type="button"
                        className="summon-btn summon-btn-multi"
                        onClick={() => cyclePull(10)}
                    >
                        <span className="summon-btn-label">Summon</span>
                        <span className="summon-btn-cost">
                            <span className="summon-btn-cost-icon">◈</span>
                            <span>45</span>
                        </span>
                        <span className="summon-btn-x">×10</span>
                        <span className="summon-btn-bonus">+1 Guaranteed</span>
                    </button>
                </div>

                <div className="summon-foot-note">
                    Coming soon — summon mechanics under construction
                </div>
            </div>
        </div>
    );
};

export default SummonPanel;
