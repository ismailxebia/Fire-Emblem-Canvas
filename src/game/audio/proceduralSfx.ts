// Procedurally-generated SFX via Web Audio API.
// Used as fallback when audio files aren't present — the game ships with
// audible feedback out of the box, no asset dependencies.
//
// Each sound is a small synth recipe (oscillator + envelope, sometimes noise).
// Style is intentionally chiptune-ish to match the pixel-art game aesthetic.

import type { SfxId } from './sounds';

export class ProceduralSfx {
    private ctx: AudioContext | null = null;
    private masterVolume = 1;

    setVolume(v: number) {
        this.masterVolume = Math.max(0, Math.min(1, v));
    }

    private getCtx(): AudioContext {
        if (!this.ctx) {
            const Ctor: typeof AudioContext =
                (window as any).AudioContext || (window as any).webkitAudioContext;
            this.ctx = new Ctor();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    private playTone({
        freq, duration, type = 'triangle', volume = 0.2,
        attack = 0.001, fadeOut = true, freqEnd,
    }: {
        freq: number; duration: number;
        type?: OscillatorType; volume?: number;
        attack?: number; fadeOut?: boolean; freqEnd?: number;
    }) {
        const ctx = this.getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        if (freqEnd !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, freqEnd), now + duration);
        }
        const peak = volume * this.masterVolume;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + attack);
        if (fadeOut) {
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else {
            gain.gain.setValueAtTime(peak, now + duration - 0.01);
            gain.gain.linearRampToValueAtTime(0, now + duration);
        }
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    private playNoise({
        duration, volume = 0.15, lowPass = 4000, highPass,
    }: { duration: number; volume?: number; lowPass?: number; highPass?: number }) {
        const ctx = this.getCtx();
        const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = lowPass;

        const gain = ctx.createGain();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(volume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        let chain: AudioNode = src;
        chain.connect(lpf);
        chain = lpf;
        if (highPass) {
            const hpf = ctx.createBiquadFilter();
            hpf.type = 'highpass';
            hpf.frequency.value = highPass;
            chain.connect(hpf);
            chain = hpf;
        }
        chain.connect(gain).connect(ctx.destination);
        src.start(now);
    }

    play(id: SfxId): void {
        switch (id) {
            // === UI ===
            case 'uiTap':
                // Crisp click — quick tick at ~1200Hz
                this.playTone({ freq: 1200, duration: 0.045, type: 'triangle', volume: 0.18 });
                break;

            case 'uiHover':
                // Subtle, lower than tap
                this.playTone({ freq: 720, duration: 0.025, type: 'triangle', volume: 0.09 });
                break;

            case 'uiCancel':
                // Lower pitch with slight downward sweep — "back" feel
                this.playTone({
                    freq: 520, freqEnd: 320, duration: 0.09, type: 'square', volume: 0.13,
                });
                break;

            case 'menuConfirm':
                // Two-note "ding-dong" rising — confirm action
                this.playTone({ freq: 523, duration: 0.08, type: 'triangle', volume: 0.18 });
                setTimeout(() => this.playTone({ freq: 784, duration: 0.14, type: 'triangle', volume: 0.22 }), 75);
                break;

            // === Battle ===
            case 'move':
                // Soft footstep noise
                this.playNoise({ duration: 0.05, volume: 0.12, lowPass: 800 });
                break;

            case 'attackHit':
                // Light hit: noise burst + low thump
                this.playNoise({ duration: 0.05, volume: 0.32, lowPass: 2200 });
                this.playTone({ freq: 180, duration: 0.07, type: 'sine', volume: 0.28 });
                break;

            case 'attackHeavy':
                // Heavier impact
                this.playNoise({ duration: 0.1, volume: 0.42, lowPass: 1500 });
                this.playTone({ freq: 110, freqEnd: 70, duration: 0.14, type: 'sine', volume: 0.38 });
                break;

            case 'miss':
                // Whoosh — high-pass noise, brief
                this.playNoise({ duration: 0.1, volume: 0.18, lowPass: 4000, highPass: 1200 });
                break;

            case 'death':
                // Descending tone — thing falling
                this.playTone({
                    freq: 440, freqEnd: 90, duration: 0.42, type: 'sawtooth', volume: 0.22,
                });
                break;

            case 'expGain':
                // Quick rising blip — collected!
                this.playTone({
                    freq: 800, freqEnd: 1200, duration: 0.12, type: 'triangle', volume: 0.15,
                });
                break;

            case 'levelUp': {
                // Major arpeggio C-E-G-C — celebratory
                const notes = [523, 659, 784, 1047];
                notes.forEach((f, i) => {
                    setTimeout(() => this.playTone({
                        freq: f, duration: 0.18, type: 'triangle', volume: 0.18,
                    }), i * 70);
                });
                break;
            }

            // === Cinematic ===
            case 'turnBanner':
                // Impact whoosh — bass + filtered noise
                this.playNoise({ duration: 0.18, volume: 0.18, lowPass: 700 });
                this.playTone({ freq: 90, duration: 0.2, type: 'sine', volume: 0.28 });
                break;

            case 'victorySting': {
                // Ascending major arpeggio — "you win"
                const stingNotes = [523, 659, 784, 1047, 1319];
                stingNotes.forEach((f, i) => {
                    setTimeout(() => this.playTone({
                        freq: f, duration: 0.24, type: 'triangle', volume: 0.22,
                    }), i * 65);
                });
                break;
            }

            default:
                // Unknown — soft generic tick
                this.playTone({ freq: 800, duration: 0.04, type: 'triangle', volume: 0.1 });
        }
    }
}

export const proceduralSfx = new ProceduralSfx();
