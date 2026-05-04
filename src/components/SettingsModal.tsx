// Settings modal — opened from main menu.
// Currently audio only; haptics / animation speed / etc can be added here.

import { useEffect, useState } from 'react';
import { audio } from '../game/audio/AudioManager';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
    const [bgmVol, setBgmVol] = useState(audio.getSettings().bgmVolume);
    const [sfxVol, setSfxVol] = useState(audio.getSettings().sfxVolume);
    const [muted, setMuted] = useState(audio.getSettings().muted);

    // Sync state from store when opening (in case other code mutated)
    useEffect(() => {
        if (!open) return;
        const s = audio.getSettings();
        setBgmVol(s.bgmVolume);
        setSfxVol(s.sfxVolume);
        setMuted(s.muted);
    }, [open]);

    useEffect(() => { audio.setBgmVolume(bgmVol); }, [bgmVol]);
    useEffect(() => { audio.setSfxVolume(sfxVol); }, [sfxVol]);
    useEffect(() => { audio.setMuted(muted); }, [muted]);

    // Esc to close
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const previewSfx = () => audio.playSfx('uiTap');

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-decor settings-decor-top" />

                <div className="settings-head">
                    <h2 className="settings-title">Settings</h2>
                    <button
                        type="button"
                        className="settings-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </div>

                <section className="settings-section">
                    <div className="settings-section-label">Audio</div>

                    <div className="settings-row">
                        <label className="settings-row-label">BGM</label>
                        <input
                            type="range"
                            min={0} max={100} step={1}
                            value={Math.round(bgmVol * 100)}
                            onChange={e => setBgmVol(Number(e.target.value) / 100)}
                        />
                        <span className="settings-row-value">{Math.round(bgmVol * 100)}</span>
                    </div>

                    <div className="settings-row">
                        <label className="settings-row-label">SFX</label>
                        <input
                            type="range"
                            min={0} max={100} step={1}
                            value={Math.round(sfxVol * 100)}
                            onChange={e => setSfxVol(Number(e.target.value) / 100)}
                            onMouseUp={previewSfx}
                            onTouchEnd={previewSfx}
                        />
                        <span className="settings-row-value">{Math.round(sfxVol * 100)}</span>
                    </div>

                    <button
                        type="button"
                        className={`settings-mute ${muted ? 'active' : ''}`}
                        onClick={() => setMuted(m => !m)}
                    >
                        {muted ? '🔇  Unmute All' : '🔊  Mute All'}
                    </button>
                </section>

                <div className="settings-decor settings-decor-bottom" />

                <button
                    type="button"
                    className="settings-back"
                    onClick={onClose}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;
