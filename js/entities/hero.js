// js/entities/hero.js
export class Hero {
  constructor(name, col, row, health = 100, attack = 20) {
    this.name = name;
    this.col = col;  // Kolom (x)
    this.row = row;  // Baris (y)
    this.health = health;
    this.attack = attack;
    // Properti lain bisa ditambahkan di sini (misalnya sprite, movementRange, dsb.)
  }

  update(deltaTime, grid) {
    // Logika update (misalnya animasi atau pergerakan) bisa ditambahkan di sini.
  }

  /**
   * Render hero pada canvas.
   * @param {CanvasRenderingContext2D} ctx - Context canvas.
   * @param {Grid} grid - Instance grid untuk mendapatkan posisi cell.
   * @param {object} camera - Objek kamera { x, y }.
   */
  render(ctx, grid, camera) {
    const pos = grid.getCellPosition(this.col, this.row);
    ctx.fillStyle = 'blue';  // Warna hero
    ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
  }
}
