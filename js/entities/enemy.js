// js/entities/enemy.js
import Unit from './unit.js';

const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 240;

// Konfigurasi aksi untuk enemy; diasumsikan spritesheet memiliki 4 frame per baris.
const ACTION_CONFIG = {
  idle: { row: 0, frameCount: 4 },
  attack: { row: 1, frameCount: 4 },
  magicIdle: { row: 2, frameCount: 4 }
};

export class Enemy extends Unit {
  /**
   * @param {string} name - Nama enemy.
   * @param {number} col - Posisi kolom pada grid.
   * @param {number} row - Posisi baris pada grid.
   * @param {number} health - Nilai kesehatan.
   * @param {number} attack - Nilai serangan.
   * @param {string} spriteUrl - URL spritesheet terpadu enemy.
   */
  constructor(name, col, row, health = 100, attack = 20, spriteUrl = "https://ik.imagekit.io/ij05ikv7z/Hero/Idle%20(2).png") {
    super(name, col, row, health, attack);
    this.spriteUrl = spriteUrl;
    this.image = new Image();
    this.image.src = spriteUrl;
    this.image.onload = () => {
      console.log(this.name, "enemy sprite loaded");
    };
    this.image.onerror = () => {
      console.error(this.name, "failed to load enemy sprite from", spriteUrl);
    };

    // Properti animasi spritesheet
    this.currentAction = 'idle'; // Default enemy selalu idle
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 200; // Interval per frame dalam milidetik

    // Properti posisi untuk render; enemy langsung menyinkronkan posisi dengan grid
    this.pixelX = 0;
    this.pixelY = 0;
  }

  // Update frame animasi berdasarkan deltaTime
  updateAnimation(deltaTime) {
    // Dapatkan konfigurasi untuk aksi saat ini; fallback ke idle jika tidak tersedia.
    const config = ACTION_CONFIG[this.currentAction] || ACTION_CONFIG.idle;
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % config.frameCount;
    }
  }

  update(deltaTime, grid) {
    // Sinkronkan posisi enemy dengan cell grid
    const pos = grid.getCellPosition(this.col, this.row);
    this.pixelX = pos.x;
    this.pixelY = pos.y;
    // Perbarui animasi spritesheet
    this.updateAnimation(deltaTime);
  }

  render(ctx, grid, camera) {
    // Dapatkan posisi cell dari grid
    const pos = grid.getCellPosition(this.col, this.row);
    // Hitung center horizontal dan bottom agar sprite di-align dengan benar
    const cellCenterX = pos.x + grid.tileSize / 2 - camera.x;
    const cellBottomY = pos.y + grid.tileSize - camera.y;

    if (this.image.complete && this.image.naturalWidth > 0) {
      const config = ACTION_CONFIG[this.currentAction] || ACTION_CONFIG.idle;
      const rowIndex = config.row;
      
      // Desired tinggi adalah 115% dari grid.tileSize
      const desiredHeight = grid.tileSize * 1.2;
      const scale = desiredHeight / FRAME_HEIGHT;
      const imgHeight = FRAME_HEIGHT * scale;
      const imgWidth = FRAME_WIDTH * scale;
      
      // Hitung offset source pada spritesheet berdasarkan frameIndex dan rowIndex
      const sourceX = this.frameIndex * FRAME_WIDTH;
      const sourceY = rowIndex * FRAME_HEIGHT;
      
      // Hitung posisi render agar sprite di-align horizontal center dan bottom
      const drawX = cellCenterX - imgWidth / 2;
      const drawY = cellBottomY - imgHeight;
      
      ctx.drawImage(
        this.image,
        sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT,
        drawX, drawY, imgWidth, imgHeight
      );
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
    }
  }
}
