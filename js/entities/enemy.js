// js/entities/enemy.js
import Unit from './unit.js';

export class Enemy extends Unit {
  constructor(name, col, row, health = 100, attack = 20, spriteUrl = "https://ik.imagekit.io/ij05ikv7z/Enemy/Enemy1.png") {
    super(name, col, row, health, attack);
    // Set URL sprite dan preload image
    this.spriteUrl = spriteUrl;
    this.image = new Image();
    this.image.src = spriteUrl;
    // Opsional: debugging load sprite
    this.image.onload = () => {
      console.log(this.name, "enemy sprite loaded");
    };

    // Jika Anda ingin menambahkan properti animasi seperti pada Hero, Anda bisa menambahkannya di sini.
    // Untuk contoh sederhana, kita langsung menggunakan posisi grid.
    this.pixelX = 0;
    this.pixelY = 0;
  }

  update(deltaTime, grid) {
    // Untuk enemy, kita langsung sinkronkan posisi pixel dengan posisi grid.
    const pos = grid.getCellPosition(this.col, this.row);
    this.pixelX = pos.x;
    this.pixelY = pos.y;
  }

  render(ctx, grid, camera) {
    // Ambil posisi cell berdasarkan grid
    const pos = grid.getCellPosition(this.col, this.row);
    // Hitung center horizontal dan bottom dari cell
    const cellCenterX = pos.x + grid.tileSize / 2 - camera.x;
    const cellBottomY = pos.y + grid.tileSize - camera.y;

    if (this.image.complete && this.image.naturalWidth > 0) {
      // Desired tinggi adalah 115% dari grid.tileSize (sesuai dengan hero)
      const desiredHeight = grid.tileSize * 1.15;
      const scale = desiredHeight / this.image.height;
      const imgHeight = this.image.height * scale;
      const imgWidth = this.image.width * scale;

      // Hitung posisi gambar agar horizontal center dan bottom aligned
      const drawX = cellCenterX - imgWidth / 2;
      const drawY = cellBottomY - imgHeight;

      ctx.drawImage(this.image, drawX, drawY, imgWidth, imgHeight);
    } else {
      // Fallback: jika image belum termuat, gambar persegi dengan warna merah.
      ctx.fillStyle = 'red';
      ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
    }
  }
}
