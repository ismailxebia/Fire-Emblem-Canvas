// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

/**
 * Fungsi A* sederhana untuk pathfinding dengan dukungan obstacle dan batas range.
 * Menggunakan Manhattan distance sebagai heuristic.
 * @param {object} grid - Objek grid dengan properti: cols, rows, getCellPosition(col, row) dan obstacles.
 * @param {object} start - Objek { col, row } sebagai titik awal.
 * @param {object} goal - Objek { col, row } sebagai titik tujuan.
 * @param {number} maxRange - Batas maksimum (Manhattan distance) yang diperbolehkan dari titik awal.
 * @returns {Array} Array node yang membentuk jalur dari start ke goal (termasuk start dan goal), atau [] jika tidak ditemukan jalur.
 */
function findPath(grid, start, goal, maxRange) {
  // Fungsi untuk membuat node dengan properti yang diperlukan
  function createNode(col, row, g, h, f, parent) {
    return { col, row, g, h, f, parent };
  }
  // Heuristic: Manhattan distance
  function heuristic(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }
  // Cek apakah koordinat valid: dalam batas grid, tidak termasuk obstacle,
  // dan berada dalam maxRange dari titik awal.
  function isValid(col, row) {
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return false;
    if (grid.obstacles && grid.obstacles.some(o => o.col === col && o.row === row)) {
      return false;
    }
    const rangeFromStart = Math.abs(col - start.col) + Math.abs(row - start.row);
    if (rangeFromStart > maxRange) return false;
    return true;
  }
  // Dapatkan tetangga (4 arah: atas, bawah, kiri, kanan)
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
    // Pilih node dengan nilai f terkecil
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    const current = openSet.splice(currentIndex, 1)[0];
    closedSet.push(current);
    
    // Jika mencapai goal, konstruksi jalur dan kembalikan
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

    // Inisialisasi heroes (dengan variasi movementRange)
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
    this.currentTurn = 'hero';  // 'hero' atau 'enemy'
    this.selectedHero = null;   // Hero yang dipilih
    this.actionMode = 'normal'; // 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // { hero, originalPosition: {col, row}, newPosition: {col, row} }

    // Tambahkan fungsi findPath ke instance battle agar dapat diakses di input.js
    this.findPath = findPath;
  }

  update(deltaTime) {
    // Update setiap hero (termasuk animasi perpindahan)
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.update(deltaTime, this.grid);
      }
    });
    // Update enemy (placeholder jika diperlukan)
  }

  render(ctx, camera) {
    // --- Render Path Line ---
    if (this.actionMode === 'move' && this.pendingMove && this.pendingMove.newPosition) {
      const origin = this.pendingMove.originalPosition;
      const goal = this.pendingMove.newPosition;
      const maxRange = this.pendingMove.hero.movementRange;
      const path = this.findPath(this.grid, origin, goal, maxRange);
      if (path.length > 0) {
        ctx.save();
        ctx.strokeStyle = 'orange';  // Warna path line untuk cell reachable
        ctx.lineWidth = 3;
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
      } else {
        // Jika tidak ada jalur valid (target unreachable), gambarkan cell target dengan overlay merah transparan
        const targetPos = this.grid.getCellPosition(goal.col, goal.row);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(targetPos.x - camera.x, targetPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
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
      // Render overlay di area lingkup hex range movement
      for (let c = origin.col - range; c <= origin.col + range; c++) {
        for (let r = origin.row - range; r <= origin.row + range; r++) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
          if (distance <= range) {
            const cellPos = this.grid.getCellPosition(c, r);
            ctx.save();
            // Cek apakah cell dapat dijangkau oleh pathfinding
            const cellPath = this.findPath(this.grid, origin, { col: c, row: r }, range);
            if (cellPath.length > 0) {
              ctx.fillStyle = 'rgba(0, 0, 255, 0.15)'; // Reachable: biru transparan
            } else {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Unreachable: merah transparan
            }
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
