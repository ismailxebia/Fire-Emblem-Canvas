import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';
import { loadStageData } from './stage/stage01.js';
import { loadHeroData } from './core/herodata.js';
import { loadEnemyData } from './core/enemydata.js';
import EffectManager from './effect/effectmanager.js';
import { showTurnOverlay, updateProfileStatus, setupActionMenu } from './ui.js';
import { AISystem } from './core/ai_system.js';
import { ActionSystem, ActionState } from './core/action_system.js';
import { BattleScene } from './core/battle_scene.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;  // Simpan reference ctx agar bisa dipakai buat pattern
    this.lastTime = 0;
    this.camera = { x: 0, y: 0 };

    this.stageData = loadStageData();
    this.backgroundImage = new Image();
    this.backgroundImage.src = this.stageData.backgroundUrl;

    this.grid = new Grid(6, 12, canvas.width);
    if (this.stageData.obstacles) {
      this.grid.obstacles = this.stageData.obstacles;
    }

    this.battle = new Battle(this.grid);
    // Penting: beri battle akses ke game untuk pattern
    this.battle.game = this;

    // Initialize Systems
    this.aiSystem = new AISystem(this.battle, this.grid);
    this.actionSystem = new ActionSystem(this);
    this.battleScene = new BattleScene(this);

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
          enemy.hexRange = this.stageData.enemyPositions[index].hexRange || 1;
          enemy.movementRange = enemy.hexRange;
        }
      });
    }

    loadHeroData().then(loadedHeroes => {
      if (loadedHeroes.length > 0) {
        this.battle.heroes = loadedHeroes;
        // Re-apply positions if needed or ensure loaded data has positions
        if (this.stageData.heroPositions) {
          this.battle.heroes.forEach((hero, index) => {
            if (this.stageData.heroPositions[index]) {
              hero.col = this.stageData.heroPositions[index].col;
              hero.row = this.stageData.heroPositions[index].row;
            }
          });
        }
      }
    }).catch(error => console.error("Error loading hero data:", error));

    loadEnemyData().then(loadedEnemies => {
      if (loadedEnemies.length > 0) {
        this.battle.enemies = loadedEnemies;
        if (this.stageData.enemyPositions) {
          this.battle.enemies.forEach((enemy, index) => {
            if (this.stageData.enemyPositions[index]) {
              enemy.col = this.stageData.enemyPositions[index].col;
              enemy.row = this.stageData.enemyPositions[index].row;
              enemy.hexRange = this.stageData.enemyPositions[index].hexRange || 1;
              enemy.movementRange = enemy.hexRange;
            }
          });
        }
      }
    }).catch(error => console.error("Error loading enemy data:", error));

    handleInput(this);
    setupActionMenu(this); // Move setupActionMenu here to ensure game is initialized

    const stageWidth = this.grid.stageWidth || canvas.width;
    const stageHeight = this.grid.stageHeight || canvas.height;
    this.effectManager = new EffectManager(stageWidth, stageHeight, this.stageData.effects);

    this.selectedIndicator = new Image();
    this.selectedIndicator.src = "assets/Selected.png";
    this.selectedIndicator.onerror = () => {
      console.error("Selected indicator gagal dimuat.");
    };

    // Membuat offscreen canvas untuk pattern diagonal
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 12;   // Sesuaikan ukuran pattern
    patternCanvas.height = 12;
    const pctx = patternCanvas.getContext('2d');
    // Gambar garis diagonal pada offscreen canvas
    pctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    pctx.lineWidth = 3;
    pctx.beginPath();
    pctx.moveTo(0, 0);
    // Gambar garis dari (0,0) ke (24,24) sehingga pattern akan repeat
    pctx.lineTo(24, 24);
    pctx.stroke();
    // Buat pattern (repeat) dan simpan ke properti
    this.diagonalPattern = this.ctx.createPattern(patternCanvas, 'repeat');

    this.turnPhase = 'start';
    this.turnNumber = 1;
    window.gameOverlayActive = true;

    // Show battle intro first
    showTurnOverlay(this.stageData.battleName || 'BATTLE START');

    // Then show Turn 1 after intro completely fades (2000ms + 500ms fade + buffer)
    setTimeout(() => {
      showTurnOverlay(`TURN ${this.turnNumber}`);
      setTimeout(() => {
        this.turnPhase = 'hero';
        window.gameOverlayActive = false;
        this.actionSystem.reset();
      }, 3000);
    }, 3000);

    this.enemyTurnProcessing = false;
    this.currentEnemyIndex = 0;
  }

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

  // drawAttackRangeOverlay (untuk fase attack)
  drawAttackRangeOverlay(hero, ctx) {
    const attackRange = hero.attackRange;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.15)"; // fill putih transparan 15%
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; // stroke putih
    ctx.lineWidth = 2;

    for (let c = hero.col - attackRange; c <= hero.col + attackRange; c++) {
      for (let r = hero.row - attackRange; r <= hero.row + attackRange; r++) {
        if (Math.abs(c - hero.col) + Math.abs(r - hero.row) <= attackRange) {
          if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;
          const pos = this.grid.getCellPosition(c, r);
          const cellX = pos.x - this.camera.x;
          const cellY = pos.y - this.camera.y;
          const tileSize = this.grid.tileSize;

          // Overlay dasar
          ctx.fillRect(cellX, cellY, tileSize, tileSize);
          ctx.strokeRect(cellX, cellY, tileSize, tileSize);

          // Cek apakah cell ditempati enemy
          const occupantEnemy = this.battle.enemies.find(e => e.col === c && e.row === r && e.health > 0);
          if (occupantEnemy) {
            ctx.save();
            ctx.fillStyle = this.diagonalPattern;
            ctx.fillRect(cellX, cellY, tileSize, tileSize);
            ctx.restore();
          }
        }
      }
    }

    ctx.restore();
  }

  processNextEnemy() {
    if (this.currentEnemyIndex >= this.battle.enemies.length) {
      this.enemyTurnProcessing = false;
      this.turnPhase = 'start';
      this.turnNumber++;
      this.battle.heroes.forEach(hero => hero.actionTaken = false);
      this.battle.enemies.forEach(enemy => enemy.actionTaken = false);
      window.gameOverlayActive = true;
      showTurnOverlay(`TURN ${this.turnNumber}`);
      setTimeout(() => {
        this.turnPhase = 'hero';
        window.gameOverlayActive = false;
        this.actionSystem.reset();
      }, 3000);
      return;
    }

    let enemy = this.battle.enemies[this.currentEnemyIndex];
    if (enemy.actionTaken || enemy.health <= 0) {
      this.currentEnemyIndex++;
      this.processNextEnemy();
      return;
    }
    enemy.showHexRange = true;
    enemy.selected = true;
    updateProfileStatus(enemy);

    setTimeout(() => {
      const dest = this.aiSystem.calculateMove(enemy);

      enemy.initialPosition = { col: enemy.col, row: enemy.row };

      setTimeout(() => {
        enemy.startMove(this.grid, dest.col, dest.row);
        enemy.actionTaken = true;
        enemy.showHexRange = false;
        enemy.selected = false;

        // Check for attack opportunity
        let target = null;
        const attackRange = enemy.attackRange || 1;

        // Simple targeting: Find first hero in range
        for (const hero of this.battle.heroes) {
          if (hero.health > 0) {
            const dist = Math.abs(enemy.col - hero.col) + Math.abs(enemy.row - hero.row);
            if (dist <= attackRange) {
              target = hero;
              break;
            }
          }
        }

        if (target) {
          // Wait for move animation to finish (approx 500ms-1s depending on distance, but startMove is visual)
          // startMove updates logical pos immediately but visual takes time.
          // Let's give it a small buffer or rely on the existing 1000ms timeout logic but nested.

          setTimeout(() => {
            this.actionSystem.executeEnemyAttack(enemy, target, () => {
              this.currentEnemyIndex++;
              this.processNextEnemy();
            });
          }, 800); // Wait for move to settle
        } else {
          setTimeout(() => {
            this.currentEnemyIndex++;
            this.processNextEnemy();
          }, 1000);
        }
      }, 1000);
    }, 1000);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.battleScene && this.battleScene.active) {
      this.battleScene.update(deltaTime);
      return; // Skip other updates while battle scene is active
    }

    this.battle.update(deltaTime);
    if (this.effectManager) {
      this.effectManager.update(deltaTime, this.camera);
    }

    if (this.turnPhase === 'hero') {
      // this.checkAttackAvailability(); // Removed, handled by ActionSystem
      const allHeroesActed = this.battle.heroes.every(hero => hero.actionTaken || hero.health <= 0);
      if (allHeroesActed) {
        setTimeout(() => {
          this.turnPhase = 'enemy';
          this.actionSystem.state = ActionState.ENEMY_TURN;
          window.gameOverlayActive = true;
          showTurnOverlay('ENEMY TURN');
          setTimeout(() => {
            window.gameOverlayActive = false;
          }, 2500);
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
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.battleScene && this.battleScene.active) {
      this.battleScene.render(ctx);
      return;
    }

    // Draw background
    if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
      // Simple cover logic
      const scale = Math.max(this.canvas.width / this.backgroundImage.width, this.canvas.height / this.backgroundImage.height);
      const w = this.backgroundImage.width * scale;
      const h = this.backgroundImage.height * scale;
      ctx.drawImage(this.backgroundImage, -this.camera.x, -this.camera.y, w, h);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw grid/battle
    this.grid.render(ctx, this.camera); // Keep grid render here
    this.battle.render(ctx, this.camera);

    // Draw effects
    if (this.effectManager) {
      this.effectManager.render(ctx, this.camera);
    }

    // Draw attack range overlay if needed
    if (this.actionSystem.state === ActionState.SELECT_ATTACK_TARGET ||
      this.actionSystem.state === ActionState.SELECT_MAGIC_TARGET) {
      if (this.battle.selectedHero) {
        this.drawAttackRangeOverlay(this.battle.selectedHero, ctx);
      }
    }
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
