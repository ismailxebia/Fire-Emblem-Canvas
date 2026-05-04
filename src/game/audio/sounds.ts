// Sound asset registry. All audio files live in /public/audio/.
// If a file is missing, the AudioManager silently skips playback —
// safe to ship without all assets.

export interface SoundConfig {
    src: string[];      // Howler accepts multiple formats; first that loads is used
    volume?: number;    // 0..1 multiplier on top of global volume
    loop?: boolean;
    rate?: number;      // playback speed
}

const audioPath = (file: string) => `audio/${file}`;

export const BGM: Record<string, SoundConfig> = {
    menu: {
        src: [audioPath('bgm/menu.mp3'), audioPath('bgm/menu.ogg')],
        loop: true,
        volume: 0.55,
    },
    battle: {
        src: [audioPath('bgm/battle.mp3'), audioPath('bgm/battle.ogg')],
        loop: true,
        volume: 0.5,
    },
    victory: {
        src: [audioPath('bgm/victory.mp3'), audioPath('bgm/victory.ogg')],
        loop: false,
        volume: 0.7,
    },
};

export const SFX: Record<string, SoundConfig> = {
    // UI
    uiTap: {
        src: [audioPath('sfx/ui-tap.mp3')],
        volume: 0.45,
    },
    uiHover: {
        src: [audioPath('sfx/ui-hover.mp3')],
        volume: 0.3,
    },
    uiCancel: {
        src: [audioPath('sfx/ui-cancel.mp3')],
        volume: 0.5,
    },
    menuConfirm: {
        src: [audioPath('sfx/menu-confirm.mp3')],
        volume: 0.6,
    },

    // Battle
    move: {
        src: [audioPath('sfx/move.mp3')],
        volume: 0.4,
    },
    attackHit: {
        src: [audioPath('sfx/attack-hit.mp3')],
        volume: 0.7,
    },
    attackHeavy: {
        src: [audioPath('sfx/attack-heavy.mp3')],
        volume: 0.8,
    },
    miss: {
        src: [audioPath('sfx/miss.mp3')],
        volume: 0.5,
    },
    death: {
        src: [audioPath('sfx/death.mp3')],
        volume: 0.7,
    },
    levelUp: {
        src: [audioPath('sfx/level-up.mp3')],
        volume: 0.7,
    },
    expGain: {
        src: [audioPath('sfx/exp-gain.mp3')],
        volume: 0.5,
    },

    // Cinematic
    turnBanner: {
        src: [audioPath('sfx/turn-banner.mp3')],
        volume: 0.6,
    },
    victorySting: {
        src: [audioPath('sfx/victory-sting.mp3')],
        volume: 0.75,
    },
};

export type BgmId = keyof typeof BGM;
export type SfxId = keyof typeof SFX;
