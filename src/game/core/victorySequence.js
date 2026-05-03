// Victory cinematic — runs after the last enemy falls.
//
// Flow:
//   1. banner          : tiny top-anchored toast "★ VICTORY ★ · +50 EXP BONUS"
//   2. focus_hero      : pan + zoom + bg-skew to a hero who leveled up,
//                        spawn floating "LEVEL UP TO N" text over their head.
//                        Loop for each leveled-up hero.
//   3. fade_out        : reset camera, fade screen to black
//   4. base_menu       : show base camp overlay
//   5. done
//
// The orchestrator is ticked from game.update().

import { showVictoryBanner } from '../ui.js';

const ZOOM_SCALE = 1.18;
const SKEW_X = 0.05;
const SKEW_Y = 0.018;

const BANNER_HOLD_MS = 1300;
const FOCUS_PAN_DELAY_MS = 380;   // wait for camera to land before showing text
const FOCUS_HOLD_MS = 1500;       // total time per hero focus
const FADE_HOLD_MS = 950;

const BONUS_EXP = 50;

export class VictorySequence {
    constructor(game) {
        this.game = game;
        this.phase = 'idle';
        this.timer = 0;
        this.active = false;
        this.heroResults = [];
        this.levelUpQueue = [];   // [{hero, finalLevel}]
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

        // Notify React layer (e.g. for Supabase sync)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gameVictory', {
                detail: { results: this.heroResults }
            }));
        }

        // Build queue of heroes who need level-up cinematic
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

        // Floating "+50 EXP" above each hero — diegetic feedback
        for (const r of this.heroResults) {
            this._spawnExpFloat(r.hero, r.expGained);
        }

        // Slim banner
        showVictoryBanner({
            stageName: stageName || this.game.stageData?.battleName || 'Stage Cleared',
            bonusExp: BONUS_EXP,
        });

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
                        this._enterFadeOut();
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
                        this._enterFadeOut();
                    }
                }
                break;

            case 'fade_out':
                if (this.timer > FADE_HOLD_MS) {
                    this._enterBaseMenu();
                }
                break;

            case 'base_menu':
                // Wait for user to dismiss
                break;
        }
    }

    _enterFocusPhase() {
        this.phase = 'focus_hero';
        this.timer = 0;
        // Apply zoom + skew (skew only affects bg in render; sprites stay upright)
        this.game.cameraTransformTarget = {
            scale: ZOOM_SCALE,
            skewX: SKEW_X,
            skewY: SKEW_Y,
        };
        this._panToCurrentTarget();
    }

    _panToCurrentTarget() {
        const target = this.levelUpQueue[this.levelUpIndex];
        if (!target) return;
        this._panToHero(target.hero);

        // Cancel any in-flight text spawn from a previous hero
        if (this._pendingTextTimer) clearTimeout(this._pendingTextTimer);

        // Wait for the camera to land before popping the text
        this._pendingTextTimer = setTimeout(() => {
            this._spawnLevelUpText(target.hero, target.finalLevel);
            this._pendingTextTimer = null;
        }, FOCUS_PAN_DELAY_MS);
    }

    _spawnExpFloat(hero, amount) {
        if (!this.game.damagePopups) return;
        const tile = this.game.grid.getCellPosition(hero.col, hero.row);
        this.game.damagePopups.spawn(
            tile.x + this.game.grid.tileSize / 2,
            tile.y - 6,
            `+${amount} EXP`,
            { color: '#7fffa0', fontSize: 13, duration: 1100, riseDistance: 28 }
        );
    }

    _spawnLevelUpText(hero, level) {
        if (!this.game.damagePopups) return;
        const tile = this.game.grid.getCellPosition(hero.col, hero.row);
        this.game.damagePopups.spawn(
            tile.x + this.game.grid.tileSize / 2,
            tile.y - 12,
            `LEVEL UP TO ${level}`,
            {
                color: '#ffd54f',
                fontSize: 18,
                duration: 1300,
                riseDistance: 42,
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

    _enterFadeOut() {
        this.phase = 'fade_out';
        this.timer = 0;
        if (this._pendingTextTimer) {
            clearTimeout(this._pendingTextTimer);
            this._pendingTextTimer = null;
        }
        // Smoothly reset camera transform — back to flat default
        this.game.cameraTransformTarget = { scale: 1, skewX: 0, skewY: 0 };
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
    }

    _finish() {
        this.phase = 'done';
        this.active = false;
        if (typeof window !== 'undefined') window.gameOverlayActive = false;
        this.onFinishCallback?.();
    }
}
