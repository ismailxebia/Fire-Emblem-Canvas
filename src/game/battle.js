// js/battle.js

import { Pathfinder } from './core/pathfinder.js';
import { PathIndicator } from './utils/pathIndicator.js';

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Module-level singleton: path indicator assets (loaded once for entire app lifetime)
let _sharedPathAssets = null;
function getPathAssets() {
  if (_sharedPathAssets) return _sharedPathAssets;
  const mk = (src) => Object.assign(new Image(), { src });
  _sharedPathAssets = {
    start: mk('assets/Start.png'),
    end: mk('assets/End.png'),
    straight: mk('assets/Lurus.png'),
    corners: {
      '1,0_0,1': mk('assets/corner_ED.png'),
      '-1,0_0,1': mk('assets/corner_ED.png'),
      '0,1_1,0': mk('assets/corner_ES.png'),
      '-1,0_0,-1': mk('assets/corner_ES.png'),
      '0,-1_-1,0': mk('assets/corner_ED.png'),
      '0,1_-1,0': mk('assets/corner_NW.png'),
      '1,0_0,-1': mk('assets/corner_NW.png'),
      '0,-1_1,0': mk('assets/corner_WN.png'),
    },
  };
  return _sharedPathAssets;
}

export default class Battle {
  constructor(grid) {
    this.grid = grid;
    this.game = null;
    this.heroes = [];
    this.enemies = [];

    // Cache for movement paths
    this._cachedMovePaths = null;
    this._lastPendingMove = null;

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
    this.pathAssets = getPathAssets();

    // Cache for the active path indicator (avoid running A* every frame)
    this._pathIndicatorCache = { key: null, path: null };

    // Spatial index: "col,row" -> unit. Rebuilt lazily when stale.
    this._spatialIndex = new Map();
    this._spatialDirty = true;
  }

  invalidateSpatialIndex() {
    this._spatialDirty = true;
  }

  _rebuildSpatialIndex() {
    this._spatialIndex.clear();
    for (const h of this.heroes) {
      if (h.health > 0) this._spatialIndex.set(`${h.col},${h.row}`, h);
    }
    for (const e of this.enemies) {
      if (e.health > 0) this._spatialIndex.set(`${e.col},${e.row}`, e);
    }
    this._spatialDirty = false;
  }

  getUnitAt(col, row) {
    if (this._spatialDirty) this._rebuildSpatialIndex();
    return this._spatialIndex.get(`${col},${row}`) || null;
  }

  getHeroAt(col, row) {
    const u = this.getUnitAt(col, row);
    return u && this.heroes.includes(u) ? u : null;
  }

  getEnemyAt(col, row) {
    const u = this.getUnitAt(col, row);
    return u && this.enemies.includes(u) ? u : null;
  }

  heroAttack(hero, enemy) {
    if (!hero || !enemy || enemy.health <= 0) return;
    const dist = Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row);
    if (dist > hero.attackRange) return;
    enemy.health -= hero.attack;
    if (enemy.health < 0) enemy.health = 0;
    hero.actionTaken = true;
  }

  update(deltaTime) {
    let needsReindex = false;

    this.heroes.forEach(hero => {
      if (hero.isDying) {
        hero.tickDeath(deltaTime);
      } else if (hero.health > 0) {
        const beforeCol = hero.col, beforeRow = hero.row;
        hero.update(deltaTime, this.grid);
        if (hero.col !== beforeCol || hero.row !== beforeRow) needsReindex = true;
      }
    });
    this.enemies.forEach(enemy => {
      if (enemy.isDying) {
        enemy.tickDeath(deltaTime);
      } else if (enemy.health > 0) {
        const beforeCol = enemy.col, beforeRow = enemy.row;
        enemy.update(deltaTime, this.grid);
        if (enemy.col !== beforeCol || enemy.row !== beforeRow) needsReindex = true;
      }
    });

    // Reap fully-dead units
    const beforeHeroCount = this.heroes.length;
    const beforeEnemyCount = this.enemies.length;
    this.heroes = this.heroes.filter(h => !h.dead);
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.heroes.length !== beforeHeroCount || this.enemies.length !== beforeEnemyCount) {
      needsReindex = true;
    }

    if (needsReindex) this._spatialDirty = true;
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

      // Check if we need to update cache
      if (this.pendingMove !== this._lastPendingMove) {
        this._cachedMovePaths = new Map();
        if (this.pendingMove) {
          const { originalPosition, hero } = this.pendingMove;
          const range = hero.movementRange;

          // Pre-calculate paths for all cells in box range
          for (let c = originalPosition.col - range; c <= originalPosition.col + range; c++) {
            for (let r = originalPosition.row - range; r <= originalPosition.row + range; r++) {
              if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
              const dist = Math.abs(c - originalPosition.col) + Math.abs(r - originalPosition.row);

              if (dist <= range) {
                const cellPath = this.findPath(this.grid, originalPosition, { col: c, row: r }, range);
                const key = `${c},${r}`;
                const isValid = cellPath.length > 0 && (cellPath.length - 1) <= range;
                this._cachedMovePaths.set(key, isValid);
              }
            }
          }
        }
        this._lastPendingMove = this.pendingMove;
      }

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

              // Gunakan hasil pathfinding dari cache
              const key = `${c},${r}`;
              // Default ke false jika belum ada di cache (seharusnya ada jika logika di atas benar)
              const isValid = this._cachedMovePaths ? this._cachedMovePaths.get(key) : false;

              let baseAlpha, baseColor;
              if (!isValid) {
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

      // Path Indicator only when active — cache path until destination changes
      if (this.actionMode === 'move' && this.pendingMove?.newPosition) {
        const np = this.pendingMove.newPosition;
        const op = this.pendingMove.originalPosition;
        const hero = this.pendingMove.hero;
        const key = `${op.col},${op.row}->${np.col},${np.row}|${hero.movementRange}`;
        if (this._pathIndicatorCache.key !== key) {
          this._pathIndicatorCache.path = this.findPath(
            this.grid, op, np, hero.movementRange
          );
          this._pathIndicatorCache.key = key;
        }
        PathIndicator.render(ctx, camera, this.grid, this._pathIndicatorCache.path, this.pathAssets);
      } else {
        this._pathIndicatorCache.key = null;
      }
    }

    // --- Render Selection Indicators (BEHIND units) ---
    if (this.indicatorImage.complete && this.indicatorImage.naturalWidth > 0) {
      // Hero selection indicator
      if (this.selectedHero && this.game.turnPhase === 'hero') {
        let targetCol = this.selectedHero.col;
        let targetRow = this.selectedHero.row;
        if (this.actionMode === 'move' && this.pendingMove) {
          targetCol = this.pendingMove.originalPosition.col;
          targetRow = this.pendingMove.originalPosition.row;
        }
        const pos = this.grid.getCellPosition(targetCol, targetRow);
        ctx.drawImage(
          this.indicatorImage,
          pos.x - camera.x, pos.y - camera.y,
          this.grid.tileSize, this.grid.tileSize
        );
      }

      // Enemy selection indicator (any enemy with .selected)
      for (const enemy of this.enemies) {
        if (!enemy.selected || enemy.health <= 0) continue;
        const pos = this.grid.getCellPosition(enemy.col, enemy.row);
        ctx.drawImage(
          this.indicatorImage,
          pos.x - camera.x, pos.y - camera.y,
          this.grid.tileSize, this.grid.tileSize
        );
      }
    }

    // --- Render Heroes (sorted by Y for depth) ---
    this.heroes.sort((a, b) => a.pixelY - b.pixelY);
    this.heroes.forEach(hero => {
      if (hero.health > 0 || hero.isDying) {
        hero.render(ctx, this.grid, camera);
      }
    });

    // --- Render Enemies ---
    this.enemies.forEach(enemy => {
      if (enemy.health > 0 || enemy.isDying) {
        enemy.render(ctx, this.grid, camera);
      }
    });
  }
}
