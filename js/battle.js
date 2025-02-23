// js/battle.js

import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function smoothStep(edge0, edge1, x) {
  let t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Fungsi A* sederhana untuk pathfinding dengan dukungan obstacle dan batas range.
 */
function findPath(grid, start, goal, maxRange, enemyUnits = []) {
  function createNode(col, row, g, h, f, parent) {
    return { col, row, g, h, f, parent };
  }
  function heuristic(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }
  function isValid(col, row) {
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return false;
    if (grid.obstacles && grid.obstacles.some(o => o.col === col && o.row === row)) return false;
    if (enemyUnits && enemyUnits.some(e => e.col === col && e.row === row)) return false;
    const rangeFromStart = Math.abs(col - start.col) + Math.abs(row - start.row);
    if (rangeFromStart > maxRange) return false;
    return true;
  }
  function getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ];
    directions.forEach(d => {
      const newCol = node.col + d.dc;
      const newRow = node.row + d.dr;
      if (isValid(newCol, newRow)) {
        neighbors.push({ col: newCol, row: newRow });
      }
    });
    return neighbors;
  }
  
  const openSet = [];
  const closedSet = [];
  const startNode = createNode(start.col, start.row, 0, heuristic(start, goal), heuristic(start, goal), null);
  openSet.push(startNode);
  
  while (openSet.length > 0) {
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    const current = openSet.splice(currentIndex, 1)[0];
    closedSet.push(current);
    
    if (current.col === goal.col && current.row === goal.row) {
      const path = [];
      let temp = current;
      while (temp !== null) {
        path.push({ col: temp.col, row: temp.row });
        temp = temp.parent;
      }
      return path.reverse();
    }
    
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (closedSet.find(n => n.col === neighbor.col && n.row === neighbor.row)) continue;
      const tentativeG = current.g + 1;
      let neighborNode = openSet.find(n => n.col === neighbor.col && n.row === neighbor.row);
      if (!neighborNode) {
        neighborNode = createNode(
          neighbor.col,
          neighbor.row,
          tentativeG,
          heuristic(neighbor, goal),
          tentativeG + heuristic(neighbor, goal),
          current
        );
        openSet.push(neighborNode);
      } else if (tentativeG < neighborNode.g) {
        neighborNode.g = tentativeG;
        neighborNode.f = tentativeG + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }
  return [];
}

export default class Battle {
  constructor(grid) {
    this.grid = grid;
    // Agar battle dapat mengakses game.diagonalPattern
    this.game = null;
    // Inisialisasi heroes (dengan variasi movementRange)
    this.heroes = [
      new Hero('HeroA', 2, 2, 100, 20, 3, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20C%20(1).png', 3),
      new Hero('HeroB', 3, 2, 90, 18, 2, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20B%20(1).png', 3),
      new Hero('HeroC', 2, 3, 80, 25, 1, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20A.png'),
      new Hero('HeroD', 3, 3, 70, 15, 3, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20D.png')
    ];
    // Inisialisasi enemies
    this.enemies = [
      new Enemy('Enemy1', 0, 8, 50, 15),
      new Enemy('Enemy2', 1, 8, 60, 18),
      new Enemy('Enemy3', 2, 9, 40, 12),
      new Enemy('Enemy4', 3, 8, 80, 20)
    ];
  
    // Properti state pertarungan
    this.currentTurn = 'hero';
    this.selectedHero = null;
    this.actionMode = 'normal'; // 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // { hero, originalPosition: {col, row}, newPosition: {col, row} }
  
    this.findPath = (grid, start, goal, maxRange) => {
      return findPath(grid, start, goal, maxRange, this.enemies);
    };
  
    this.hexOverlayProgress = 0; // Nilai 0 = overlay tidak terlihat, 1 = overlay penuh
  
    this.indicatorImage = new Image();
    this.indicatorImage.src = 'assets/Selected.png';
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
      this.hexOverlayProgress = Math.min(this.hexOverlayProgress + deltaTime / 500, 1);
    } else {
      this.hexOverlayProgress = Math.max(this.hexOverlayProgress - deltaTime / 500, 0);
    }
  }
  
  render(ctx, camera) {
    // --- Render Move Range Overlay (jika actionMode 'move') ---
    if (this.actionMode === 'move' && this.pendingMove) {
      const origin = this.pendingMove.originalPosition;
      const range = this.pendingMove.hero.movementRange;
      const delayFactor = 0.2;
      const activationDuration = 0.3;
      const easedGlobalProgress = easeInOutQuad(this.hexOverlayProgress);
  
      for (let c = origin.col - range; c <= origin.col + range; c++) {
        for (let r = origin.row - range; r <= origin.row + range; r++) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
          if (distance <= range) {
            const cellPos = this.grid.getCellPosition(c, r);
            ctx.save();
            const cellDelay = distance * delayFactor;
            const cellProgress = Math.min(Math.max((easedGlobalProgress - cellDelay) / activationDuration, 0), 1);
            const finalProgress = cellProgress === 1 ? 1 : cellProgress;
  
            // Cek occupant: bisa hero lain atau enemy
            const occupyingUnit = this.heroes.find(h => h !== this.pendingMove.hero && h.col === c && h.row === r) ||
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
            ctx.fillStyle = `rgba(${baseColor}, ${finalAlpha})`;
            ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
  
            // [Tambahan Pattern] Jika cell ditempati enemy, timpa dengan pattern diagonal
            const occupyingEnemy = this.enemies.find(e => e.col === c && e.row === r && e.health > 0);
            if (occupyingEnemy && this.game && this.game.diagonalPattern) {
              ctx.save();
              ctx.fillStyle = this.game.diagonalPattern;
              ctx.globalAlpha = 0.5; // Atur transparansi pattern
              ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
              ctx.restore();
            }
  
            if (!occupyingUnit && cellProgress === 1) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 2;
              ctx.strokeRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            }
            ctx.restore();
          }
        }
      }
  
      // Jika ada pendingMove.newPosition, gambarkan path (kode path bisa disisipkan di sini)
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
    if (this.selectedHero && typeof this.selectedHero.col === 'number' && typeof this.selectedHero.row === 'number') {
      const pos = this.grid.getCellPosition(this.selectedHero.col, this.selectedHero.row);
      ctx.save();
      if (this.indicatorImage.complete && this.indicatorImage.naturalWidth > 0) {
        ctx.drawImage(this.indicatorImage, pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      } else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      }
      ctx.restore();
    }
  }
}
