// js/entities/hero.js
export class Hero {
  constructor(name, col, row, health, attack, movementRange = 3) {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.attack = attack;
    this.movementRange = movementRange; // Sekarang movementRange sudah terdefinisi, defaultnya 3
  }

  update(deltaTime, grid) {
    // Logika update untuk hero (misalnya animasi atau pergerakan) dapat diimplementasikan di sini.
  }

  render(ctx, grid, camera) {
    const pos = grid.getCellPosition(this.col, this.row);
    ctx.fillStyle = 'blue';
    ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
  }
}
