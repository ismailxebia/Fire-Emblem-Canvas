# Audio Assets

Drop audio files (MP3 preferred, OGG fallback supported) into the matching subfolders.
The game **runs silently if a file is missing** — no errors, no crashes. You can ship
without all assets and add them incrementally.

## Folder structure

```
public/audio/
  bgm/       ← background music (loops)
  sfx/       ← short one-shots
```

## Files referenced by the game

### BGM

| File                | When                  | Length       |
|---------------------|-----------------------|--------------|
| `bgm/menu.mp3`      | Main menu             | 1–3 min loop |
| `bgm/battle.mp3`    | During battle         | 1–3 min loop |
| `bgm/victory.mp3`   | Stage cleared         | 5–15 s       |

### SFX

| File                       | When                          |
|----------------------------|-------------------------------|
| `sfx/ui-tap.mp3`           | Tap a unit on the grid        |
| `sfx/ui-hover.mp3`         | Hover/focus a menu item       |
| `sfx/ui-cancel.mp3`        | Cancel/back action            |
| `sfx/menu-confirm.mp3`     | "Start Battle" pressed        |
| `sfx/move.mp3`             | Hero starts moving            |
| `sfx/attack-hit.mp3`       | Attack landed (damage < 25)   |
| `sfx/attack-heavy.mp3`     | Attack landed (damage ≥ 25)   |
| `sfx/miss.mp3`             | Attack missed (damage = 0)    |
| `sfx/death.mp3`            | Unit defeated                 |
| `sfx/level-up.mp3`         | Hero leveled up               |
| `sfx/exp-gain.mp3`         | Hero gained EXP (no level up) |
| `sfx/turn-banner.mp3`      | "TURN N" banner appears       |
| `sfx/victory-sting.mp3`    | Stage clear sting             |

## Where to find free audio (CC0 / royalty-free)

- **freesound.org** — huge library, filter by CC0 license
- **opengameart.org** — game-focused, mostly CC-BY or CC0
- **pixabay.com/sound-effects** — free for commercial use
- **soundbible.com** — free public-domain SFX
- **incompetech.com** — Kevin MacLeod's free music (CC-BY)

## Format notes

- **MP3 recommended** — best browser/mobile compatibility. AAC also works.
- **OGG optional** as fallback — Howler tries srcs in order.
- **Keep BGM under 3MB** if possible (mobile users on cellular data).
- **SFX target ≤ 50 KB** each.
- **Sample rate 44.1 kHz** is standard. Stereo for music, mono for SFX is fine.

## Tuning volumes

Per-sound volume multipliers are in [src/game/audio/sounds.ts](../../src/game/audio/sounds.ts).
The user-controlled BGM/SFX master volumes are in the audio settings panel
(speaker icon top-right of the screen).
