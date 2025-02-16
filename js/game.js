import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';
import { loadStageData } from './stage/stage01.js';
import { loadHeroData } from './core/herodata.js';
import { loadEnemyData } from './core/enemydata.js';
import EffectManager from './effect/effectmanager.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastTime = 0;
    this.camera = { x: 0, y: 0 };

    // Muat data stage
    this.stageData = loadStageData();

    this.backgroundImage = new Image();
    this.backgroundImage.src = this.stageData.backgroundUrl;

    this.grid = new Grid(6, 12, canvas.width);
    if (this.stageData.obstacles) {
      this.grid.obstacles = this.stageData.obstacles;
    }

    this.battle = new Battle(this.grid);
    // Atur posisi hero & enemy seperti sebelumnya ...

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

    // Buat EffectManager sesuai konfigurasi stage
    const stageWidth = this.grid.stageWidth || canvas.width;
    const stageHeight = this.grid.stageHeight || canvas.height;
    this.effectManager = new EffectManager(stageWidth, stageHeight, this.stageData.effects);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.battle.update(deltaTime);
    if (this.effectManager) {
      this.effectManager.update(deltaTime, this.camera);
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundImage.complete) {
      // Render background seperti sebelumnya
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

    // Render efek-efek, misalnya cloud, rain, dsb.
    if (this.effectManager) {
      this.effectManager.render(ctx, this.camera);
    }

    this.grid.render(ctx, this.camera);
    this.battle.render(ctx, this.camera);
  }
}
