// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

/**
 * Fungsi A* sederhana untuk pathfinding tanpa rintangan.
 * Menggunakan Manhattan distance sebagai heuristic.
 * @param {object} grid - Objek grid dengan properti cols, rows, dan method getCellPosition(col, row)
 * @param {object} start - Objek { col, row } sebagai titik awal
 * @param {object} goal - Objek { col, row } sebagai titik tujuan
 * @returns {Array} Array node yang membentuk jalur dari start hingga goal (termasuk keduanya)
 */
function findPath(grid, start, goal) {
  // Membuat node dengan properti
  function createNode(col, row, g, h, f, parent) {
    return { col, row, g, h, f, parent };
  }

  function heuristic(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  function isValid(col, row) {
    return col >= 0 && col < grid.cols && row >= 0 && row < grid.rows;
  }

  function getNeighbors(node) {
    const neighbors = [];
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ];
    dirs.forEach(d => {
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
    // Pilih node dengan f terkecil
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    const current = openSet.splice(currentIndex, 1)[0];
    closedSet.push(current);

    if (current.col === goal.col && current.row === goal.row) {
      // Konstruksi jalur
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
      if (closedSet.find(n => n.col === neighbor.col && n.row === neighbor.row)) {
        continue;
      }
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
  // Jika tidak ditemukan jalur, kembalikan array kosong
  return [];
}

export default class Battle {
  constructor(grid) {
    this.grid = grid;

    // Inisialisasi heroes (variasi movementRange)
    this.heroes = [
      new Hero('HeroA', 2, 2, 100, 20, 3), // movementRange = 3
      new Hero('HeroB', 3, 2, 90, 18, 2),  // movementRange = 2
      new Hero('HeroC', 2, 3, 80, 25, 1),  // movementRange = 1
      new Hero('HeroD', 3, 3, 70, 15, 3)   // movementRange = 3
    ];

    // Inisialisasi enemies
    this.enemies = [
      new Enemy('Enemy1', 0, 19, 50, 15),
      new Enemy('Enemy2', 1, 19, 60, 18),
      new Enemy('Enemy3', 2, 19, 40, 12),
      new Enemy('Enemy4', 3, 19, 80, 20)
    ];

    // Properti state pertarungan
    this.currentTurn = 'hero'; // 'hero' atau 'enemy'
    this.selectedHero = null;  // Hero yang dipilih
    this.actionMode = 'normal'; // 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // { hero, originalPosition: {col, row}, newPosition: {col, row} }
  }

  update(deltaTime) {
    // Update setiap hero (termasuk animasi perpindahan)
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.update(deltaTime, this.grid);
      }
    });
    // Update enemy (placeholder)
  }

  render(ctx, camera) {
    // --- Render Path Line (jika mode move dan pendingMove.newPosition ada) ---
    if (this.actionMode === 'move' && this.pendingMove && this.pendingMove.newPosition) {
      const origin = this.pendingMove.originalPosition;
      const goal = this.pendingMove.newPosition;
      const path = findPath(this.grid, origin, goal);
      if (path.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#888888';  // Warna path line
        ctx.lineWidth = 32;
        ctx.beginPath();
        // Mulai dari center cell dari node pertama
        let firstPos = this.grid.getCellPosition(path[0].col, path[0].row);
        firstPos.x += this.grid.tileSize / 2;
        firstPos.y += this.grid.tileSize / 2;
        ctx.moveTo(firstPos.x - camera.x, firstPos.y - camera.y);
        for (let i = 1; i < path.length; i++) {
          let pos = this.grid.getCellPosition(path[i].col, path[i].row);
          pos.x += this.grid.tileSize / 2;
          pos.y += this.grid.tileSize / 2;
          ctx.lineTo(pos.x - camera.x, pos.y - camera.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // --- Render Heroes ---
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
    if (this.selectedHero) {
      const pos = this.grid.getCellPosition(this.selectedHero.col, this.selectedHero.row);
      ctx.save();
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      ctx.restore();
    }

    // --- Render Overlay Jangkauan dan Indikator Posisi Asli ---
    if (this.actionMode === 'move' && this.pendingMove) {
      const origin = this.pendingMove.originalPosition;
      const range = this.pendingMove.hero.movementRange;
      // Gambar overlay untuk cell yang dapat dijangkau
      for (let c = 0; c < this.grid.cols; c++) {
        for (let r = 0; r < this.grid.rows; r++) {
          const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
          if (distance <= range) {
            const cellPos = this.grid.getCellPosition(c, r);
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 255, 0.15)';
            ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            ctx.restore();
          }
        }
      }
      // Gambar indikator posisi asli (dashed rectangle)
      const origPos = this.grid.getCellPosition(origin.col, origin.row);
      ctx.save();
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(origPos.x - camera.x, origPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      ctx.restore();
    }
  }
}
