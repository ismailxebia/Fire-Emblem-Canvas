// js/entities/hero.js

// Definisikan kecepatan default secara global (dalam pixel per detik)
const DEFAULT_MOVE_SPEED = 850; // Ubah nilai ini untuk mengatur kecepatan global

export class Hero {
  constructor(name, col, row, health, attack, movementRange = 3) {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.attack = attack;
    this.movementRange = movementRange; // misalnya 1, 2, atau 3
    this.moveSpeed = DEFAULT_MOVE_SPEED; // Gunakan kecepatan default global

    // Posisi pixel untuk animasi
    this.pixelX = 0;
    this.pixelY = 0;
    // Target pixel untuk animasi perpindahan
    this.targetPixelX = 0;
    this.targetPixelY = 0;
    // Posisi awal untuk animasi
    this.startPixelX = 0;
    this.startPixelY = 0;
    this.isMoving = false;  // Flag untuk animasi perpindahan
    this.moveProgress = 0;  // Progres animasi (0 hingga 1)
    this.moveDuration = 0;  // Durasi animasi dalam milidetik
    // Target grid cell akhir
    this.targetCol = col;
    this.targetRow = row;
  }

  // Fungsi easing untuk interpolasi (easeInOutQuad)
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Mulai perpindahan secara smooth dari posisi saat ini ke grid cell baru
  startMove(grid, newCol, newRow) {
    // Simpan target grid cell
    this.targetCol = newCol;
    this.targetRow = newRow;
    // Simpan posisi awal berdasarkan posisi pixel saat ini
    this.startPixelX = this.pixelX;
    this.startPixelY = this.pixelY;
    // Hitung target posisi pixel berdasarkan grid
    const targetPos = grid.getCellPosition(newCol, newRow);
    this.targetPixelX = targetPos.x;
    this.targetPixelY = targetPos.y;
    // Hitung jarak antara posisi awal dan target
    const dx = this.targetPixelX - this.startPixelX;
    const dy = this.targetPixelY - this.startPixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Hitung durasi animasi berdasarkan jarak dan kecepatan global (dalam milidetik)
    this.moveDuration = (distance / this.moveSpeed) * 1000;
    this.moveProgress = 0;
    this.isMoving = true;
  }

  // Update animasi perpindahan hero
  update(deltaTime, grid) {
    if (!this.isMoving) {
      // Jika tidak dalam animasi, pastikan posisi pixel sesuai dengan grid
      const pos = grid.getCellPosition(this.col, this.row);
      this.pixelX = pos.x;
      this.pixelY = pos.y;
    } else {
      // Tambahkan progres animasi berdasarkan deltaTime
      this.moveProgress += deltaTime / this.moveDuration;
      let t = Math.min(this.moveProgress, 1); // Pastikan tidak melebihi 1
      let easedT = this.easeInOutQuad(t);
      // Interpolasi posisi pixel secara smooth
      this.pixelX = this.startPixelX + (this.targetPixelX - this.startPixelX) * easedT;
      this.pixelY = this.startPixelY + (this.targetPixelY - this.startPixelY) * easedT;
      // Jika animasi selesai, set posisi akhir secara final
      if (t >= 1) {
        this.isMoving = false;
        this.col = this.targetCol;
        this.row = this.targetRow;
      }
    }
  }

  // Render hero menggunakan posisi pixel untuk mendukung animasi yang halus
  render(ctx, grid, camera) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.pixelX - camera.x, this.pixelY - camera.y, grid.tileSize, grid.tileSize);
  }
}
