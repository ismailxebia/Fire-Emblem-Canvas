// js/game.js
import Grid from './grid.js';
import Battle from './battle.js';
import { handleInput } from './input.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastTime = 0;
    // Kamera untuk scrolling (offset)
    this.camera = { x: 0, y: 0 };

    // Buat grid dengan 8 kolom dan 20 baris, sesuai lebar canvas
    this.grid = new Grid(8, 20, canvas.width);

    // Buat instance battle yang akan mengelola 4 hero dan 4 enemy
    this.battle = new Battle(this.grid);

    // Setup input (drag, tap, keyboard, dsb)
    handleInput(this);
  }

  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Update logika pertarungan, yang akan mengatur pergerakan, aksi, giliran, dsb.
    this.battle.update(deltaTime);
  }

  render(ctx) {
    // Bersihkan canvas dan isi background putih
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render grid terlebih dahulu (agar garis grid terlihat)
    this.grid.render(ctx, this.camera);

    // Render unit-unit pertarungan (heroes dan enemy) melalui modul battle
    this.battle.render(ctx, this.camera);
  }
}
