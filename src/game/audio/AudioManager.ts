// Centralized audio manager — wraps Howler.js.
// Handles:
//   - BGM with crossfade between scenes
//   - One-shot SFX with concurrent playback
//   - Mobile autoplay restrictions (defers BGM until user gesture)
//   - Volume + mute persistence to localStorage
//   - Silent fallback if asset 404s — game keeps working without audio

import { Howl, Howler } from 'howler';
import { BGM, SFX, type BgmId, type SfxId } from './sounds';
import { proceduralSfx } from './proceduralSfx';

const STORAGE_KEY = 'fec_audio_settings_v1';

interface AudioSettings {
    bgmVolume: number;     // 0..1
    sfxVolume: number;     // 0..1
    muted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
    bgmVolume: 0.6,
    sfxVolume: 0.8,
    muted: false,
};

class AudioManager {
    private settings: AudioSettings = { ...DEFAULT_SETTINGS };

    private bgmHowl: Howl | null = null;
    private bgmId: BgmId | null = null;
    private bgmRequestedId: BgmId | null = null;

    private sfxHowls = new Map<SfxId, Howl>();
    /** 'file' = use loaded Howl, 'procedural' = generate via Web Audio */
    private sfxMode = new Map<SfxId, 'file' | 'procedural'>();

    private unlocked = false; // true after first user gesture

    constructor() {
        if (typeof window === 'undefined') return;
        this.loadSettings();
        this.installUnlockListener();
        this.installVisibilityHandler();
        this.preloadSfx();
        proceduralSfx.setVolume(this.settings.sfxVolume);
    }

    /**
     * Try to preload all SFX files. If a file fails to load (404 etc),
     * mark that sfx id to use procedural synthesis instead.
     */
    private preloadSfx(): void {
        for (const id of Object.keys(SFX) as SfxId[]) {
            const cfg = SFX[id];
            const howl = new Howl({
                src: cfg.src,
                preload: true,
                volume: 1,
                onload: () => this.sfxMode.set(id, 'file'),
                onloaderror: () => this.sfxMode.set(id, 'procedural'),
            });
            this.sfxHowls.set(id, howl);
        }
    }

    // === Settings ===

    private loadSettings(): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) Object.assign(this.settings, JSON.parse(raw));
        } catch { /* ignore */ }
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch { /* ignore */ }
    }

    getSettings(): AudioSettings {
        return { ...this.settings };
    }

    setBgmVolume(v: number): void {
        this.settings.bgmVolume = Math.max(0, Math.min(1, v));
        this.saveSettings();
        if (this.bgmHowl) {
            const cfg = this.bgmId ? BGM[this.bgmId] : null;
            this.bgmHowl.volume(this.settings.muted ? 0 : this.settings.bgmVolume * (cfg?.volume ?? 1));
        }
    }

    setSfxVolume(v: number): void {
        this.settings.sfxVolume = Math.max(0, Math.min(1, v));
        this.saveSettings();
        proceduralSfx.setVolume(this.settings.muted ? 0 : this.settings.sfxVolume);
    }

    setMuted(muted: boolean): void {
        this.settings.muted = muted;
        this.saveSettings();
        Howler.mute(muted);
        proceduralSfx.setVolume(muted ? 0 : this.settings.sfxVolume);
    }

    toggleMute(): boolean {
        this.setMuted(!this.settings.muted);
        return this.settings.muted;
    }

    // === Mobile autoplay handling ===

    private installUnlockListener(): void {
        if (this.unlocked) return;
        const unlock = () => {
            this.unlocked = true;
            // Apply muted state
            Howler.mute(this.settings.muted);
            // If a BGM was requested before unlock, start it now
            if (this.bgmRequestedId && !this.bgmHowl) {
                this.playBgm(this.bgmRequestedId);
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    }

    private installVisibilityHandler(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.bgmHowl) this.bgmHowl.pause();
            } else {
                if (this.bgmHowl && !this.settings.muted) this.bgmHowl.play();
            }
        });
    }

    // === BGM ===

    /** Play (or crossfade to) a background track. */
    playBgm(id: BgmId, fadeMs = 800): void {
        if (this.bgmId === id && this.bgmHowl) return;
        this.bgmRequestedId = id;

        // Defer until user gesture
        if (!this.unlocked) return;

        const cfg = BGM[id];
        if (!cfg) return;

        const targetVol = this.settings.muted ? 0 : this.settings.bgmVolume * (cfg.volume ?? 1);

        // Fade out + stop current
        if (this.bgmHowl) {
            const prev = this.bgmHowl;
            prev.fade(prev.volume(), 0, fadeMs);
            setTimeout(() => { try { prev.stop(); prev.unload(); } catch { } }, fadeMs + 50);
        }

        const next = new Howl({
            src: cfg.src,
            loop: cfg.loop ?? true,
            html5: true,         // streaming, helps with longer tracks
            volume: 0,
            onloaderror: () => {
                // Silent fallback if file missing
                if (this.bgmId === id) {
                    this.bgmHowl = null;
                    this.bgmId = null;
                }
            },
            onplayerror: () => {
                // Some browsers throw if play() called before unlock — try once more after gesture
                next.once('unlock', () => next.play());
            },
        });
        next.play();
        next.fade(0, targetVol, fadeMs);

        this.bgmHowl = next;
        this.bgmId = id;
    }

    stopBgm(fadeMs = 600): void {
        this.bgmRequestedId = null;
        if (!this.bgmHowl) return;
        const prev = this.bgmHowl;
        prev.fade(prev.volume(), 0, fadeMs);
        setTimeout(() => { try { prev.stop(); prev.unload(); } catch { } }, fadeMs + 50);
        this.bgmHowl = null;
        this.bgmId = null;
    }

    // === SFX ===

    /**
     * Play a one-shot sound effect. Concurrent calls allowed.
     * Routes to file (Howler) if loaded, otherwise procedural synth.
     */
    playSfx(id: SfxId, opts: { rate?: number; volume?: number } = {}): void {
        if (!this.unlocked || this.settings.muted) return;
        const cfg = SFX[id];
        if (!cfg) return;

        const mode = this.sfxMode.get(id);
        if (mode === 'file') {
            const howl = this.sfxHowls.get(id);
            if (!howl) return;
            const vol = (opts.volume ?? 1) * this.settings.sfxVolume * (cfg.volume ?? 1);
            const rate = opts.rate ?? cfg.rate ?? 1;
            const soundId = howl.play();
            howl.volume(vol, soundId);
            howl.rate(rate, soundId);
        } else {
            // 'procedural' OR not loaded yet — use synth fallback
            proceduralSfx.play(id);
        }
    }
}

export const audio = new AudioManager();

// Convenience: expose on window for non-module callers (game.js, action_system.js)
if (typeof window !== 'undefined') {
    (window as any).__audio = audio;
}
