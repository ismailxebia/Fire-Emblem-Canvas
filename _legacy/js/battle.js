// js/battle.js

import { Pathfinder } from './core/pathfinder.js';
import { PathIndicator } from './utils/pathIndicator.js';

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default class Battle {
  constructor(grid) {
    this.grid = grid;
    this.game = null;
    this.heroes = [];
    this.enemies = [];

    // Properti state pertarungan
    this.currentTurn = 'hero';
    this.selectedHero = null;
    this.actionMode = 'normal'; // 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // { hero, originalPosition: {col, row}, newPosition: {col, row} }

    this.findPath = (grid, start, goal, maxRange) => {
      return Pathfinder.findPath(grid, start, goal, maxRange, grid.obstacles, this.enemies);
    };

    this.hexOverlayProgress = 0; // Nilai 0 = overlay tidak terlihat, 1 = overlay penuh

    this.indicatorImage = new Image();
    this.indicatorImage.src = 'assets/Selected.png';
    this._loadPathAssets();
  }

  heroAttack(hero, enemy) {
    if (!hero || !enemy || enemy.health <= 0) return;
    const dist = Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row);
    if (dist > hero.attackRange) return;
    enemy.health -= hero.attack;
    if (enemy.health < 0) enemy.health = 0;
    hero.actionTaken = true;
  }

  _loadPathAssets() {
    // Load sekali, self-contained
    this.pathAssets = {
      start: Object.assign(new Image(), { src: 'assets/Start.png' }),
      end: Object.assign(new Image(), { src: 'assets/End.png' }),
      straight: Object.assign(new Image(), { src: 'assets/Lurus.png' }),
      corners: {
        '1,0_0,1': Object.assign(new Image(), { src: 'assets/corner_ED.png' }),
        '-1,0_0,1': Object.assign(new Image(), { src: 'assets/corner_ED.png' }),
        '0,1_1,0': Object.assign(new Image(), { src: 'assets/corner_ES.png' }), // Udah bener
        '-1,0_0,-1': Object.assign(new Image(), { src: 'assets/corner_ES.png' }),
        '0,-1_-1,0': Object.assign(new Image(), { src: 'assets/corner_ED.png' }), // Udah bener
        '0,1_-1,0': Object.assign(new Image(), { src: 'assets/corner_NW.png' }),  // Udah bener
        '1,0_0,-1': Object.assign(new Image(), { src: 'assets/corner_NW.png' }),  // Udah bener
        '0,-1_1,0': Object.assign(new Image(), { src: 'assets/corner_WN.png' }),  // Udah bener
      }
    };
  }

  update(deltaTime) {
    // Update semua heroes
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.update(deltaTime, this.grid);
      }
    });
    // Update semua enemies
    this.enemies.forEach(enemy => {
      if (enemy.health > 0) {
        enemy.update(deltaTime, this.grid);
      }
    });
    // Update overlay progress: naik jika mode move aktif, turun jika tidak.
    if (this.actionMode === 'move') {
      this.hexOverlayProgress = Math.min(this.hexOverlayProgress + deltaTime / 300, 1);
    } else {
      this.hexOverlayProgress = Math.max(this.hexOverlayProgress - deltaTime / 300, 0);
    }
  }

  render(ctx, camera) {
    // --- Render Move Range Overlay ---
    // Capture data for fade out
    let moveOverlayData = null;
    if (this.actionMode === 'move' && this.pendingMove) {
      moveOverlayData = {
        origin: this.pendingMove.originalPosition,
        range: this.pendingMove.hero.movementRange,
        hero: this.pendingMove.hero
      };
      this.lastMoveData = moveOverlayData;
    } else if (this.hexOverlayProgress > 0 && this.lastMoveData) {
      moveOverlayData = this.lastMoveData;
    }

    if (moveOverlayData) {
      const { origin, range, hero } = moveOverlayData;
      const delayFactor = 0.15; // Tighter wave
      const activationDuration = 0.4;

      // Calculate max delay to normalize progress
      const maxDelay = range * delayFactor;
      // Map 0-1 progress to 0-(1+maxDelay) so all cells finish
      const easedGlobalProgress = easeInOutQuad(this.hexOverlayProgress) * (1 + maxDelay);

      for (let c = origin.col - range; c <= origin.col + range; c++) {
        for (let r = origin.row - range; r <= origin.row + range; r++) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
          if (distance <= range) {
            const cellPos = this.grid.getCellPosition(c, r);
            ctx.save();
            const cellDelay = distance * delayFactor;
            const cellProgress = Math.min(Math.max((easedGlobalProgress - cellDelay) / activationDuration, 0), 1);

            if (cellProgress > 0) {
              const finalProgress = cellProgress;

              // Cek occupant: bisa hero lain atau enemy
              const occupyingUnit = this.heroes.find(h => h !== hero && h.col === c && h.row === r) ||
                this.enemies.find(e => e.col === c && e.row === r);

              // Tentukan warna overlay berdasarkan validitas cell (menggunakan pathfinding)
              const cellPath = this.findPath(this.grid, origin, { col: c, row: r }, range);
              let baseAlpha, baseColor;
              if (cellPath.length === 0 || (cellPath.length - 1) > range) {
                baseAlpha = 0.3;
                baseColor = '255,0,0'; // Merah untuk tidak dapat dijangkau
              } else {
                baseAlpha = occupyingUnit ? 0.15 : 0.3;
                baseColor = '0,0,255'; // Biru untuk dapat dijangkau
              }
              const finalAlpha = finalProgress * baseAlpha;

              // Scale Animation: 70% -> 100%
              const scale = 0.7 + (0.3 * finalProgress);
              const size = this.grid.tileSize * scale;
              const offset = (this.grid.tileSize - size) / 2;

              ctx.fillStyle = `rgba(${baseColor}, ${finalAlpha})`;
              ctx.fillRect(cellPos.x - camera.x + offset, cellPos.y - camera.y + offset, size, size);

              // [Tambahan Pattern] Jika cell ditempati enemy, timpa dengan pattern diagonal
              const occupyingEnemy = this.enemies.find(e => e.col === c && e.row === r && e.health > 0);
              if (occupyingEnemy && this.game && this.game.diagonalPattern) {
                ctx.save();
                ctx.fillStyle = this.game.diagonalPattern;
                ctx.globalAlpha = 0.5 * finalProgress; // Fade pattern too
                ctx.fillRect(cellPos.x - camera.x + offset, cellPos.y - camera.y + offset, size, size);
                ctx.restore();
              }

              if (!occupyingUnit && cellProgress === 1) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.strokeRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
              }
            }
            ctx.restore();
          }
        }
      }

      // Path Indicator only when active
      if (this.actionMode === 'move' && this.pendingMove?.newPosition) {
        const path = this.findPath(this.grid,
          this.pendingMove.originalPosition,
          this.pendingMove.newPosition,
          this.pendingMove.hero.movementRange
        );
        PathIndicator.render(ctx, camera, this.grid, path, this.pathAssets);
      }
    }

    // --- Render Heroes ---
    this.heroes.sort((a, b) => a.pixelY - b.pixelY);
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.render(ctx, this.grid, camera);
      }
    });

    // --- Render Enemies ---
    this.enemies.forEach(enemy => {
      if (enemy.health > 0) {
        enemy.render(ctx, this.grid, camera);
      }
    });

    // --- Render Indikator Seleksi Hero ---
    // --- Render Indikator Seleksi Hero ---
    if (this.selectedHero && this.game.turnPhase === 'hero') {
      // If moving, show indicator at ORIGINAL position to indicate start point
      let targetCol = this.selectedHero.col;
      let targetRow = this.selectedHero.row;

      if (this.actionMode === 'move' && this.pendingMove) {
        targetCol = this.pendingMove.originalPosition.col;
        targetRow = this.pendingMove.originalPosition.row;
      }

      const pos = this.grid.getCellPosition(targetCol, targetRow);
      ctx.save();
      ctx.drawImage(
        this.indicatorImage,
        pos.x - camera.x,
        pos.y - camera.y,
        this.grid.tileSize,
        this.grid.tileSize
      );
      ctx.restore();
    }
  }
}
