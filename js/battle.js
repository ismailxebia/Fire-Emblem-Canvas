// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

/**
 * Fungsi smoothStep: mengembalikan nilai interpolasi smooth dari 0 ke 1.
 * Jika x <= edge0, maka 0; jika x >= edge1, maka 1; di antaranya, interpolasi smooth.
 */
function smoothStep(edge0, edge1, x) {
  let t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Fungsi A* sederhana untuk pathfinding dengan dukungan obstacle dan batas range.
 * Menggunakan Manhattan distance sebagai heuristic.
 * 
 * @param {object} grid - Objek grid dengan properti: cols, rows, getCellPosition(col, row) dan obstacles.
 * @param {object} start - Objek { col, row } sebagai titik awal.
 * @param {object} goal - Objek { col, row } sebagai titik tujuan.
 * @param {number} maxRange - Batas maksimum (Manhattan distance) dari titik awal.
 * @param {Array} enemyUnits - Array unit enemy yang dianggap sebagai obstacle.
 * @returns {Array} Array node yang membentuk jalur dari start ke goal, atau [] jika tidak ditemukan jalur.
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

    // Inisialisasi heroes (dengan variasi movementRange)
    this.heroes = [
      new Hero('HeroA', 2, 2, 100, 20, 3, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20C%20(1).png'),
      new Hero('HeroB', 3, 2, 90, 18, 2, 'https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20B%20(1).png'),
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

    // Bind fungsi findPath sehingga enemy dianggap sebagai obstacle
    this.findPath = (grid, start, goal, maxRange) => {
      return findPath(grid, start, goal, maxRange, this.enemies);
    };

    // Properti untuk animasi overlay hex range (efek gelombang)
    this.hexOverlayProgress = 0; // Nilai 0 = overlay tidak terlihat, 1 = overlay penuh

    // Preload gambar indikator kustom untuk unit yang dipilih
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
    // --- Render Hex Range Overlay dan Path Line (jika mode move) ---
    if (this.actionMode === 'move' && this.pendingMove) {
      const origin = this.pendingMove.originalPosition;
      const range = this.pendingMove.hero.movementRange;
      // Parameter untuk animasi gelombang: delay per cell dan durasi transisi tiap cell.
      const delayFactor = 0.15;         // Delay per unit jarak
      const activationDuration = 0.15;    // Durasi transisi tiap cell

      // Render overlay untuk setiap cell dalam jangkauan.
      for (let c = origin.col - range; c <= origin.col + range; c++) {
        for (let r = origin.row - range; r <= origin.row + range; r++) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
          if (distance <= range) {
            const cellPos = this.grid.getCellPosition(c, r);
            ctx.save();
            // Hitung delay untuk cell berdasarkan jarak
            const cellDelay = distance * delayFactor;
            // Gunakan smoothStep untuk fade in/out; cellProgress dari 0 ke 1
            const cellProgress = smoothStep(cellDelay, cellDelay + activationDuration, this.hexOverlayProgress);
            // Tentukan base intensitas overlay (konstan) untuk cell yang dapat dijangkau:
            // Jika cell tidak dapat dijangkau (path tidak valid), gunakan warna merah transparent.
            const cellPath = this.findPath(this.grid, origin, { col: c, row: r }, range);
            let baseAlpha;
            let baseColor;
            if (cellPath.length === 0 || (cellPath.length - 1) > range) {
              baseAlpha = 0.3;
              baseColor = '255,0,0'; // Merah untuk tidak dapat dijangkau
            } else {
              // Jika ditempati oleh unit (ally atau enemy), intensitas lebih rendah
              const occupyingUnit = this.heroes.find(h => h !== this.pendingMove.hero && h.col === c && h.row === r) ||
                                      this.enemies.find(e => e.col === c && e.row === r);
              if (occupyingUnit) {
                baseAlpha = 0.15;
              } else {
                baseAlpha = 0.3; // Untuk cell kosong yang dapat dijangkau, kita gunakan 0.3 (atau 0.35 jika diinginkan)
              }
              baseColor = '0,0,255';
            }
            // Final overlay alpha adalah baseAlpha, tetapi hanya muncul jika cellProgress mencapai 1.
            // Jika tidak, kita gunakan interpolasi dari 0 ke baseAlpha.
            const finalAlpha = cellProgress * baseAlpha;
            ctx.fillStyle = `rgba(${baseColor}, ${finalAlpha})`;
            ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            
            // Jika cell kosong dan sudah full aktif, tambahkan outline dengan warna biru (atau putih sesuai permintaan sebelumnya).
            if (!(
              this.heroes.find(h => h !== this.pendingMove.hero && h.col === c && h.row === r) ||
              this.enemies.find(e => e.col === c && e.row === r)
            ) && cellProgress === 1) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 2;
              ctx.strokeRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            }
            ctx.restore();
          }
        }
      }
      
      // Render Path Line (jika target dipilih) di atas overlay, namun di bawah unit
      if (this.pendingMove.newPosition) {
        const goal = this.pendingMove.newPosition;
        const maxRange = this.pendingMove.hero.movementRange;
        const path = this.findPath(this.grid, origin, goal, maxRange);
        if (path.length > 0 && (path.length - 1) <= maxRange) {
          ctx.save();
          const getCellCenter = (cell) => {
            const pos = this.grid.getCellPosition(cell.col, cell.row);
            return { x: pos.x + this.grid.tileSize / 2, y: pos.y + this.grid.tileSize / 2 };
          };
          const startPos = getCellCenter(path[0]);
          const endPos = getCellCenter(path[path.length - 1]);
          const gradient = ctx.createLinearGradient(startPos.x - camera.x, startPos.y - camera.y,
                                                    endPos.x - camera.x, endPos.y - camera.y);
          gradient.addColorStop(0, 'rgba(138,127,255,0.8)');
          gradient.addColorStop(1, 'rgba(144,89,255,0.8)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 20;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          let prev = getCellCenter(path[0]);
          ctx.moveTo(prev.x - camera.x, prev.y - camera.y);
          for (let i = 1; i < path.length; i++) {
            const current = getCellCenter(path[i]);
            if (i < path.length - 1) {
              const next = getCellCenter(path[i + 1]);
              ctx.arcTo(current.x - camera.x, current.y - camera.y,
                        next.x - camera.x, next.y - camera.y,
                        12);
            } else {
              ctx.lineTo(current.x - camera.x, current.y - camera.y);
            }
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    
    // --- Render Heroes (sorted berdasarkan pixelY agar layering benar) ---
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
      if (this.indicatorImage && this.indicatorImage.complete && this.indicatorImage.naturalWidth > 0) {
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
