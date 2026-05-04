// Victory cinematic — runs after the last enemy falls.
//
// Flow (no overlapping animations — each phase finishes before the next):
//   1. banner          : tiny top toast "★ VICTORY ★ · +50 EXP BONUS"
//   2. focus_hero      : pan + zoom + bg perspective on a leveled-up hero,
//                        spawn floating "LEVEL UP TO N" text. Loop per hero.
//   3. cooldown        : reset camera transform smoothly (no zoom/skew)
//   4. fade_out        : THEN dim the screen to black
//   5. base_menu       : show base camp overlay
//   6. done

import { showVictoryBanner } from '../ui.js';

function _audio() {
    return (typeof window !== 'undefined' && window.__audio) ? window.__audio : null;
}

// Camera state during cinematic
const ZOOM_SCALE = 1.22;
const SKEW_X = 0.06;
const SKEW_Y = 0.025;
const PERSPECTIVE = 0.42;        // bg vertical taper — Octopath-style depth

// Timings (ms)
const BANNER_HOLD_MS = 1100;
const FOCUS_PAN_DELAY_MS = 280;  // wait for camera to land before showing text
const FOCUS_HOLD_MS = 1300;      // total time per hero focus
const COOLDOWN_MS = 380;         // camera resets to default before fade
const FADE_HOLD_MS = 800;

const BONUS_EXP = 50;

export class VictorySequence {
    constructor(game) {
        this.game = game;
        this.phase = 'idle';
        this.timer = 0;
        this.active = false;
        this.heroResults = [];
        this.levelUpQueue = [];
        this.levelUpIndex = 0;
        this._pendingTextTimer = null;
        this.onFinishCallback = null;
    }

    start({ stageName } = {}) {
        if (this.active) return;
        const heroes = this.game.battle.heroes.filter(h => h.health > 0);
        if (heroes.length === 0) return;

        // Award bonus EXP, collect results
        this.heroResults = [];
        for (const h of heroes) {
            if (typeof h.gainExp !== 'function') continue;
            const result = h.gainExp(BONUS_EXP);
            this.heroResults.push({
                hero: h,
                expGained: result?.gained ?? BONUS_EXP,
                levelUps: result?.levelUps ?? [],
            });
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gameVictory', {
                detail: { results: this.heroResults }
            }));
        }

        // Queue ONLY heroes who actually leveled up — they get the cinematic
        this.levelUpQueue = this.heroResults
            .filter(r => r.levelUps.length > 0)
            .map(r => ({
                hero: r.hero,
                finalLevel: r.levelUps[r.levelUps.length - 1].newLevel,
            }));
        this.levelUpIndex = 0;

        this.active = true;
        this.timer = 0;
        if (typeof window !== 'undefined') window.gameOverlayActive = true;

        showVictoryBanner({
            stageName: stageName || this.game.stageData?.battleName || 'Stage Cleared',
            bonusExp: BONUS_EXP,
        });

        // Audio: play victory sting and crossfade to victory BGM (if exists)
        const a = _audio();
        if (a) {
            a.playSfx('victorySting');
            a.playBgm('victory', 600);
        }

        this.phase = 'banner';
    }

    update(deltaTime) {
        if (!this.active) return;
        this.timer += deltaTime;

        switch (this.phase) {
            case 'banner':
                if (this.timer > BANNER_HOLD_MS) {
                    if (this.levelUpQueue.length > 0) {
                        this._enterFocusPhase();
                    } else {
                        this._enterCooldown();
                    }
                }
                break;

            case 'focus_hero':
                if (this.timer > FOCUS_HOLD_MS) {
                    this.levelUpIndex++;
                    if (this.levelUpIndex < this.levelUpQueue.length) {
                        this._panToCurrentTarget();
                        this.timer = 0;
                    } else {
                        this._enterCooldown();
                    }
                }
                break;

            case 'cooldown':
                // Wait for camera to fully reset to default (no zoom/skew)
                // BEFORE we start fading — so user sees a clean reset, not
                // a fade-during-zoom mess.
                if (this.timer > COOLDOWN_MS) {
                    this._enterFadeOut();
                }
                break;

            case 'fade_out':
                if (this.timer > FADE_HOLD_MS) {
                    this._enterBaseMenu();
                }
                break;

            case 'base_menu':
                break;
        }
    }

    _enterFocusPhase() {
        this.phase = 'focus_hero';
        this.timer = 0;
        // Background gets the dramatic transform; sprites stay upright.
        this.game.cameraTransformTarget = {
            scale: ZOOM_SCALE,
            skewX: SKEW_X,
            skewY: SKEW_Y,
            perspective: PERSPECTIVE,
        };
        this._panToCurrentTarget();
    }

    _panToCurrentTarget() {
        const target = this.levelUpQueue[this.levelUpIndex];
        if (!target) return;
        this._panToHero(target.hero);

        if (this._pendingTextTimer) clearTimeout(this._pendingTextTimer);
        this._pendingTextTimer = setTimeout(() => {
            this._spawnLevelUpText(target.hero, target.finalLevel);
            this._pendingTextTimer = null;
        }, FOCUS_PAN_DELAY_MS);
    }

    _spawnLevelUpText(hero, level) {
        if (!this.game.damagePopups) return;
        const tile = this.game.grid.getCellPosition(hero.col, hero.row);
        this.game.damagePopups.spawn(
            tile.x + this.game.grid.tileSize / 2,
            tile.y - 14,
            `LEVEL UP TO ${level}`,
            {
                color: '#ffd54f',
                fontSize: 18,
                duration: 1200,
                riseDistance: 44,
                isCrit: true,
            }
        );
    }

    _panToHero(hero) {
        if (!hero) return;
        const grid = this.game.grid;
        const canvas = this.game.canvas;
        const cellPos = grid.getCellPosition(hero.col, hero.row);
        const cellCenterX = cellPos.x + grid.tileSize / 2;
        const cellCenterY = cellPos.y + grid.tileSize / 2;

        const lw = canvas.clientWidth || canvas.width;
        const lh = canvas.clientHeight || canvas.height;

        let targetX = cellCenterX - lw / 2;
        let targetY = cellCenterY - lh / 2;

        const maxX = Math.max(0, grid.stageWidth - lw);
        const maxY = Math.max(0, grid.stageHeight - lh);
        targetX = Math.max(0, Math.min(targetX, maxX));
        targetY = Math.max(0, Math.min(targetY, maxY));

        this.game.cameraPanTarget = { x: targetX, y: targetY };
    }

    _enterCooldown() {
        this.phase = 'cooldown';
        this.timer = 0;
        if (this._pendingTextTimer) {
            clearTimeout(this._pendingTextTimer);
            this._pendingTextTimer = null;
        }
        // Reset camera transform smoothly — back to flat default.
        // Pan target preserved so we end on the last hero (no jump).
        this.game.cameraTransformTarget = {
            scale: 1, skewX: 0, skewY: 0, perspective: 0,
        };
    }

    _enterFadeOut() {
        this.phase = 'fade_out';
        this.timer = 0;
        const overlay = document.getElementById('victoryFade');
        if (overlay) overlay.classList.add('active');
    }

    _enterBaseMenu() {
        this.phase = 'base_menu';
        this.timer = 0;
        const overlay = document.getElementById('victoryFade');
        if (overlay) overlay.classList.remove('active');
        const base = document.getElementById('baseMenu');
        if (base) base.classList.add('active');
        // Crossfade back to menu BGM in the base camp
        const a = _audio();
        if (a) a.playBgm('menu', 1000);
    }

    _finish() {
        this.phase = 'done';
        this.active = false;
        if (typeof window !== 'undefined') window.gameOverlayActive = false;
        this.onFinishCallback?.();
    }
}
