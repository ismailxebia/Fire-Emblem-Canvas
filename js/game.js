// js/game.js
import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';
import { loadStageData } from './stage/stage01.js';
import { loadHeroData } from './core/herodata.js';
import { loadEnemyData } from './core/enemydata.js';
import EffectManager from './effect/effectmanager.js';
import { showTurnOverlay } from './ui.js';

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
          hero.actionTaken = false; // Flag untuk turn-based
        }
      });
    }
    if (this.stageData.enemyPositions) {
      this.battle.enemies.forEach((enemy, index) => {
        if (this.stageData.enemyPositions[index]) {
          enemy.col = this.stageData.enemyPositions[index].col;
          enemy.row = this.stageData.enemyPositions[index].row;
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

    // Inisialisasi state turn-based
    this.turnPhase = 'start'; // 'start', 'hero', 'enemy'
    this.turnNumber = 1;
    window.gameOverlayActive = true; // Nonaktifkan interaksi game saat overlay aktif
    showTurnOverlay(`${this.stageData.battleName}\nTURN ${this.turnNumber}`);
    setTimeout(() => {
      this.turnPhase = 'hero';
      window.gameOverlayActive = false;
    }, 3000);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.battle.update(deltaTime);
    if (this.effectManager) {
      this.effectManager.update(deltaTime, this.camera);
    }

    // Logika turn-based sederhana
    if (this.turnPhase === 'hero') {
      const allHeroesActed = this.battle.heroes.every(hero => hero.actionTaken);
      if (allHeroesActed) {
        this.turnPhase = 'enemy';
        // Enemy turn placeholder (dapat digantikan dengan logika AI lebih kompleks)
        setTimeout(() => {
          // Setelah enemy turn, reset turn
          this.turnPhase = 'start';
          this.turnNumber++;
          this.battle.heroes.forEach(hero => hero.actionTaken = false);
          window.gameOverlayActive = true;
          showTurnOverlay(`${this.stageData.battleName}\nTURN ${this.turnNumber}`);
          setTimeout(() => {
            this.turnPhase = 'hero';
            window.gameOverlayActive = false;
          }, 3000);
        }, 1500);
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
    this.battle.render(ctx, this.camera);
  }
}
