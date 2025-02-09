// js/game.js
import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';
import { loadStageData } from './stage/stage01.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastTime = 0;
    // Kamera untuk scrolling (offset)
    this.camera = { x: 0, y: 0 };

    // Muat data stage (background, posisi unit, obstacle, dll.)
    this.stageData = loadStageData();

    // Preload background image dari stageData
    this.backgroundImage = new Image();
    this.backgroundImage.src = this.stageData.backgroundUrl;

    // Inisialisasi grid menggunakan canvas.width dan safe area (padding) di grid.js.
    // Misalnya, buat grid dengan 6 kolom dan 12 baris.
    this.grid = new Grid(6, 12, canvas.width);

    // Update obstacle grid menggunakan data stage, jika tersedia
    if (this.stageData.obstacles) {
      this.grid.obstacles = this.stageData.obstacles;
    }

    // Inisialisasi battle dengan grid
    this.battle = new Battle(this.grid);

    // Set posisi hero berdasarkan data stage, jika tersedia
    if (this.stageData.heroPositions) {
      this.battle.heroes.forEach((hero, index) => {
        if (this.stageData.heroPositions[index]) {
          hero.col = this.stageData.heroPositions[index].col;
          hero.row = this.stageData.heroPositions[index].row;
        }
      });
    }
    // Set posisi enemy berdasarkan data stage, jika tersedia
    if (this.stageData.enemyPositions) {
      this.battle.enemies.forEach((enemy, index) => {
        if (this.stageData.enemyPositions[index]) {
          enemy.col = this.stageData.enemyPositions[index].col;
          enemy.row = this.stageData.enemyPositions[index].row;
        }
      });
    }

    // Setup input handler (drag, tap, keyboard, dsb.)
    handleInput(this);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.battle.update(deltaTime);
  }

  render(ctx) {
    // Bersihkan canvas dan isi background putih
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // --- Render Background ---
    // Kita akan mengatur background agar fit (cover) seluruh stage.
    // Gunakan stageWidth dan stageHeight dari grid (termasuk safe area)
    if (this.backgroundImage.complete) {
      const stageWidth = this.grid.stageWidth;
      const stageHeight = this.grid.stageHeight;
      // Hitung faktor skala untuk "cover" stage tanpa mengubah aspect ratio
      const scale = Math.max(stageWidth / this.backgroundImage.width, stageHeight / this.backgroundImage.height);
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      // Center background dalam stage
      const offsetX = (stageWidth - scaledWidth) / 2;
      const offsetY = (stageHeight - scaledHeight) / 2;
      // Terapkan camera offset sehingga background ikut scroll
      const destX = offsetX - this.camera.x;
      const destY = offsetY - this.camera.y;
      ctx.drawImage(this.backgroundImage, destX, destY, scaledWidth, scaledHeight);
    } else {
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // --- Render Grid ---
    this.grid.render(ctx, this.camera);

    // --- Render Battle (Heroes, Enemies, Overlay, dsb.) ---
    this.battle.render(ctx, this.camera);
  }
}
