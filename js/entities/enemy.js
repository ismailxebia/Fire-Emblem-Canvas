// js/entities/enemy.js
import Unit from './unit.js';

export class Enemy extends Unit {
  constructor(name, col, row, health = 100, attack = 20) {
    super(name, col, row, health, attack);
    // Tambahkan properti khusus untuk enemy di sini.
  }

  update(deltaTime, grid) {
    // Logika update untuk enemy.
  }

  decideAction(heroes) {
    // Contoh logika AI: Pilih hero pertama.
    return heroes[0];
  }

  render(ctx, grid, camera) {
    const pos = grid.getCellPosition(this.col, this.row);
    ctx.fillStyle = 'red';
    ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
  }
}
