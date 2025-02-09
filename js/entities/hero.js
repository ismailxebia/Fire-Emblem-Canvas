// js/entities/hero.js

// Definisikan kecepatan default secara global (dalam pixel per detik)
const DEFAULT_MOVE_SPEED = 850;

export class Hero {
  /**
   * @param {string} name - Nama hero.
   * @param {number} col - Posisi kolom pada grid.
   * @param {number} row - Posisi baris pada grid.
   * @param {number} health - Nilai kesehatan.
   * @param {number} attack - Nilai serangan.
   * @param {number} movementRange - Jangkauan pergerakan (dalam cell), default 3.
   * @param {string} spriteUrl - URL gambar sprite hero. Default menggunakan placeholder.
   */
  constructor(name, col, row, health, attack, movementRange = 3, spriteUrl = "https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20C.png") {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.attack = attack;
    this.movementRange = movementRange;
    this.moveSpeed = DEFAULT_MOVE_SPEED;
    
    // Set URL sprite dan buat objek Image untuk preload
    this.spriteUrl = spriteUrl;
    this.image = new Image();
    this.image.src = spriteUrl;
    // Opsional: debugging image load
    this.image.onload = () => {
      console.log(this.name, "sprite loaded");
    };

    // Properti untuk animasi perpindahan (dalam pixel)
    this.pixelX = 0;
    this.pixelY = 0;
    this.targetPixelX = 0;
    this.targetPixelY = 0;
    this.startPixelX = 0;
    this.startPixelY = 0;
    this.isMoving = false;
    this.moveProgress = 0;
    this.moveDuration = 0;
    this.targetCol = col;
    this.targetRow = row;
  }

  // Fungsi easing untuk interpolasi (easeInOutQuad)
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Mulai animasi perpindahan ke grid cell baru
  startMove(grid, newCol, newRow) {
    this.targetCol = newCol;
    this.targetRow = newRow;
    // Simpan posisi awal (dalam pixel) dari posisi hero saat ini
    this.startPixelX = this.pixelX;
    this.startPixelY = this.pixelY;
    // Hitung target posisi pixel berdasarkan cell grid
    const targetPos = grid.getCellPosition(newCol, newRow);
    this.targetPixelX = targetPos.x;
    this.targetPixelY = targetPos.y;
    // Hitung jarak antara posisi awal dan target
    const dx = this.targetPixelX - this.startPixelX;
    const dy = this.targetPixelY - this.startPixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Hitung durasi animasi berdasarkan jarak dan kecepatan global (dalam milidetik),
    // dan gunakan nilai minimum (misalnya 150ms) agar animasi tidak langsung selesai.
    this.moveDuration = Math.max((distance / this.moveSpeed) * 1000, 150);
    this.moveProgress = 0;
    this.isMoving = true;
  }

  // Update animasi perpindahan hero
  update(deltaTime, grid) {
    if (!this.isMoving) {
      // Jika tidak dalam animasi, pastikan posisi pixel sesuai dengan cell grid
      const pos = grid.getCellPosition(this.col, this.row);
      this.pixelX = pos.x;
      this.pixelY = pos.y;
    } else {
      this.moveProgress += deltaTime / this.moveDuration;
      let t = Math.min(this.moveProgress, 1); // t dalam rentang [0,1]
      let easedT = this.easeInOutQuad(t);
      // Interpolasi posisi pixel secara smooth
      this.pixelX = this.startPixelX + (this.targetPixelX - this.startPixelX) * easedT;
      this.pixelY = this.startPixelY + (this.targetPixelY - this.startPixelY) * easedT;
      if (t >= 1) {
        this.isMoving = false;
        this.col = this.targetCol;
        this.row = this.targetRow;
      }
    }
  }

  // Render hero menggunakan sprite image secara responsif.
  // Gambar akan di-render agar:
  // - Menggunakan nilai interpolasi (this.pixelX, this.pixelY) sehingga animasi perpindahan terlihat.
  // - Di-align horizontal center dan bottom pada cell grid.
  // - Ukuran gambar diskalakan agar tinggi mencapai 90% dari grid.tileSize, menjaga aspect ratio.
  // - Gambar tidak di-clipping, sehingga bisa overflow (jika diinginkan).
  render(ctx, grid, camera) {
    // Gunakan nilai interpolasi (this.pixelX, this.pixelY) sebagai posisi render.
    const pos = { x: this.pixelX, y: this.pixelY };
    
    // Hitung center horizontal dan bottom dari cell berdasarkan posisi cell (tetap menggunakan grid.getCellPosition untuk cell dasar)
    // Jika hero tidak bergerak, cellPos = grid.getCellPosition(this.col, this.row);
    // Tetapi kita render berdasarkan pos (yang merupakan nilai interpolasi) sehingga animasi terlihat.
    const cellPos = pos; // pos sudah di-update melalui animasi
    const cellCenterX = cellPos.x + grid.tileSize / 2 - camera.x;
    const cellBottomY = cellPos.y + grid.tileSize - camera.y;
    
    if (this.image.complete && this.image.naturalWidth > 0) {
      // Desired tinggi adalah 90% dari grid.tileSize (bisa diubah sesuai kebutuhan)
      const desiredHeight = grid.tileSize * 1.15;
      const scale = desiredHeight / this.image.height;
      const imgHeight = this.image.height * scale;
      const imgWidth = this.image.width * scale;
      
      // Hitung posisi gambar agar horizontal center dan bottom aligned
      const drawX = cellCenterX - imgWidth / 2;
      const drawY = cellBottomY - imgHeight;
      
      ctx.drawImage(this.image, drawX, drawY, imgWidth, imgHeight);
    } else {
      ctx.fillStyle = 'blue';
      ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, grid.tileSize, grid.tileSize);
    }
  }
}
