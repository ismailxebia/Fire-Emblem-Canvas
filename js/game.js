// js/game.js
import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';
import { loadStageData } from './stage/stage01.js';
import { loadHeroData } from './core/herodata.js';
import { loadEnemyData } from './core/enemydata.js';
import EffectManager from './effect/effectmanager.js';
import { showTurnOverlay, updateProfileStatus } from './ui.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastTime = 0;
    this.camera = { x: 0, y: 0 };

    // Muat data stage (termasuk properti battleName)
    this.stageData = loadStageData();
    this.backgroundImage = new Image();
    this.backgroundImage.src = this.stageData.backgroundUrl;

    // Inisialisasi grid
    this.grid = new Grid(6, 12, canvas.width);
    if (this.stageData.obstacles) {
      this.grid.obstacles = this.stageData.obstacles;
    }

    // Inisialisasi battle
    this.battle = new Battle(this.grid);
    if (this.stageData.heroPositions) {
      this.battle.heroes.forEach((hero, index) => {
        if (this.stageData.heroPositions[index]) {
          hero.col = this.stageData.heroPositions[index].col;
          hero.row = this.stageData.heroPositions[index].row;
          hero.actionTaken = false;
        }
      });
    }
    if (this.stageData.enemyPositions) {
      this.battle.enemies.forEach((enemy, index) => {
        if (this.stageData.enemyPositions[index]) {
          enemy.col = this.stageData.enemyPositions[index].col;
          enemy.row = this.stageData.enemyPositions[index].row;
          enemy.actionTaken = false;
          // Pastikan enemy menggunakan hexRange dari data JSON
          enemy.hexRange = this.stageData.enemyPositions[index].hexRange || 1;
          enemy.movementRange = enemy.hexRange;
        }
      });
    }

    loadHeroData().then(loadedHeroes => {
      if (loadedHeroes.length > 0) {
        this.battle.heroes = loadedHeroes;
      }
    }).catch(error => console.error("Error loading hero data:", error));

    loadEnemyData().then(loadedEnemies => {
      if (loadedEnemies.length > 0) {
        this.battle.enemies = loadedEnemies;
      }
    }).catch(error => console.error("Error loading enemy data:", error));

    handleInput(this);

    const stageWidth = this.grid.stageWidth || canvas.width;
    const stageHeight = this.grid.stageHeight || canvas.height;
    this.effectManager = new EffectManager(stageWidth, stageHeight, this.stageData.effects);

    // Load selected indicator image untuk enemy
    this.selectedIndicator = new Image();
    this.selectedIndicator.src = "assets/Selected.png";
    this.selectedIndicator.onerror = () => {
      console.error("Selected indicator gagal dimuat.");
    };

    // Inisialisasi state turn-based
    this.turnPhase = 'start'; // 'start', 'hero', 'enemy'
    this.turnNumber = 1;
    window.gameOverlayActive = true;
    showTurnOverlay(`${this.stageData.battleName}\nTURN ${this.turnNumber}`);
    setTimeout(() => {
      this.turnPhase = 'hero';
      window.gameOverlayActive = false;
    }, 3000);

    // Untuk memproses enemy secara berurutan
    this.enemyTurnProcessing = false;
    this.currentEnemyIndex = 0;
  }

  // Fungsi pembantu: Periksa apakah suatu cell sudah ditempati (obstacle, hero, atau enemy)
  isCellOccupied(col, row) {
    if (this.grid.obstacles && this.grid.obstacles.some(o => o.col === col && o.row === row)) return true;
    if (this.battle.heroes.some(hero => hero.col === col && hero.row === row)) return true;
    if (this.battle.enemies.some(enemy => enemy.col === col && enemy.row === row)) return true;
    return false;
  }

  // Fungsi pembantu: Kumpulkan candidate cell dalam jangkauan enemy.
  // Kandidat mencakup cell asal agar enemy dapat memilih untuk tidak bergerak.
  getCandidateCells(enemy) {
    const candidates = [];
    const range = enemy.movementRange;
    for (let c = enemy.col - range; c <= enemy.col + range; c++) {
      for (let r = enemy.row - range; r <= enemy.row + range; r++) {
        if (Math.abs(c - enemy.col) + Math.abs(r - enemy.row) <= range) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          if (c === enemy.col && r === enemy.row) {
            candidates.push({ col: c, row: r });
          } else if (!this.isCellOccupied(c, r)) {
            candidates.push({ col: c, row: r });
          }
        }
      }
    }
    return candidates;
  }

  // Fungsi untuk menggambar hex range overlay untuk enemy
  drawEnemyHexRange(enemy, ctx) {
    const hexRange = enemy.hexRange;
    ctx.save();
    ctx.fillStyle = "rgba(255,0,0,0.2)";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    for (let c = enemy.col - hexRange; c <= enemy.col + hexRange; c++) {
      for (let r = enemy.row - hexRange; r <= enemy.row + hexRange; r++) {
        if (Math.abs(c - enemy.col) + Math.abs(r - enemy.row) <= hexRange) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const pos = this.grid.getCellPosition(c, r);
          ctx.fillRect(pos.x - this.camera.x, pos.y - this.camera.y, this.grid.tileSize, this.grid.tileSize);
          ctx.strokeRect(pos.x - this.camera.x, pos.y - this.camera.y, this.grid.tileSize, this.grid.tileSize);
        }
      }
    }
    ctx.restore();
  }

  // Fungsi untuk memproses enemy secara berurutan dalam fase enemy turn dengan timeout
  processNextEnemy() {
    if (this.currentEnemyIndex >= this.battle.enemies.length) {
      this.enemyTurnProcessing = false;
      this.turnPhase = 'start';
      this.turnNumber++;
      this.battle.heroes.forEach(hero => hero.actionTaken = false);
      this.battle.enemies.forEach(enemy => enemy.actionTaken = false);
      window.gameOverlayActive = true;
      showTurnOverlay(`${this.stageData.battleName}\nTURN ${this.turnNumber}`);
      setTimeout(() => {
        this.turnPhase = 'hero';
        window.gameOverlayActive = false;
      }, 3000);
      return;
    }

    let enemy = this.battle.enemies[this.currentEnemyIndex];
    if (enemy.actionTaken) {
      this.currentEnemyIndex++;
      this.processNextEnemy();
      return;
    }
    // Tampilkan overlay hex range dan selected indicator untuk enemy aktif
    enemy.showHexRange = true;
    enemy.selected = true;
    updateProfileStatus(enemy);

    setTimeout(() => {
      // Dapatkan candidate cell yang valid dalam jangkauan enemy
      let candidates = this.getCandidateCells(enemy);
      let dest = { col: enemy.col, row: enemy.row };
      // Pilih target hero terdekat (heuristik sederhana)
      let targetHero = null;
      let minDist = Infinity;
      this.battle.heroes.forEach(hero => {
        const dist = Math.abs(enemy.col - hero.col) + Math.abs(enemy.row - hero.row);
        if (dist < minDist) {
          minDist = dist;
          targetHero = hero;
        }
      });
      if (targetHero && candidates.length > 0) {
        let bestCandidate = null;
        let bestDistance = Infinity;
        candidates.forEach(cell => {
          const d = Math.abs(cell.col - targetHero.col) + Math.abs(cell.row - targetHero.row);
          if (d < bestDistance) {
            bestDistance = d;
            bestCandidate = cell;
          }
        });
        if (bestCandidate) dest = bestCandidate;
      }
      
      // Simpan posisi awal enemy sebelum bergerak (untuk overlay initial position)
      enemy.initialPosition = { col: enemy.col, row: enemy.row };
      
      setTimeout(() => {
        enemy.startMove(this.grid, dest.col, dest.row);
        enemy.actionTaken = true;
        enemy.showHexRange = false;
        enemy.selected = false;
        setTimeout(() => {
          this.currentEnemyIndex++;
          this.processNextEnemy();
        }, 1000);
      }, 1000);
    }, 1000);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.battle.update(deltaTime);
    if (this.effectManager) {
      this.effectManager.update(deltaTime, this.camera);
    }

    if (this.turnPhase === 'hero') {
      const allHeroesActed = this.battle.heroes.every(hero => hero.actionTaken);
      if (allHeroesActed) {
        setTimeout(() => {
          this.turnPhase = 'enemy';
          window.gameOverlayActive = true;
        }, 1000);
      }
    } else if (this.turnPhase === 'enemy') {
      if (!this.enemyTurnProcessing) {
        this.enemyTurnProcessing = true;
        this.currentEnemyIndex = 0;
        this.processNextEnemy();
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundImage.complete) {
      const stageWidth = this.grid.stageWidth;
      const stageHeight = this.grid.stageHeight;
      const scale = Math.max(stageWidth / this.backgroundImage.width, stageHeight / this.backgroundImage.height);
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      const offsetX = (stageWidth - scaledWidth) / 2;
      const offsetY = (stageHeight - scaledHeight) / 2;
      const destX = offsetX - this.camera.x;
      const destY = offsetY - this.camera.y;
      ctx.drawImage(this.backgroundImage, destX, destY, scaledWidth, scaledHeight);
    } else {
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.effectManager) {
      this.effectManager.render(ctx, this.camera);
    }
    this.grid.render(ctx, this.camera);

    // Gambar overlay hex range untuk enemy yang sedang aktif (di bawah unit)
    if (this.turnPhase === 'enemy' && this.enemyTurnProcessing && this.currentEnemyIndex < this.battle.enemies.length) {
      let enemy = this.battle.enemies[this.currentEnemyIndex];
      if (enemy.showHexRange) {
        this.drawEnemyHexRange(enemy, ctx);
      }
    }

    // Gambar selected indicator untuk enemy
    this.battle.enemies.forEach(enemy => {
      if (enemy.selected) {
        const pos = this.grid.getCellPosition(enemy.col, enemy.row);
        if (this.selectedIndicator.complete && this.selectedIndicator.naturalWidth > 0) {
          ctx.drawImage(
            this.selectedIndicator,
            pos.x - this.camera.x,
            pos.y - this.camera.y,
            this.grid.tileSize,
            this.grid.tileSize
          );
        }
      }
    });

    this.battle.render(ctx, this.camera);
  }
}
