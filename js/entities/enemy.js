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
    this.frameInterval = 200; // Interval per frame (ms)

    // Properti untuk animasi pergerakan (mirip dengan hero)
    // Posisi untuk render di canvas akan diperbarui melalui animasi pergerakan
    this.pixelX = 0;
    this.pixelY = 0;
    this.isMoving = false;
    this.moveProgress = 0;
    this.moveDuration = 0;
    this.targetCol = col;
    this.targetRow = row;
    this.startPixelX = 0;
    this.startPixelY = 0;

    // Flag untuk menandai bahwa enemy sudah bertindak pada turn ini.
    this.actionTaken = false;
    
    // Misalnya, tetapkan movementRange default untuk enemy (bisa diatur dari data)
    this.movementRange = 2; 
  }

  // Fungsi easing sederhana untuk interpolasi (easeInOutQuad)
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Update frame animasi berdasarkan deltaTime
  updateAnimation(deltaTime) {
    const config = ACTION_CONFIG[this.currentAction] || ACTION_CONFIG.idle;
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % config.frameCount;
    }
  }

  // Mulai animasi pergerakan enemy ke grid cell baru
  startMove(grid, newCol, newRow) {
    this.targetCol = newCol;
    this.targetRow = newRow;
    this.startPixelX = this.pixelX;
    this.startPixelY = this.pixelY;
    const targetPos = grid.getCellPosition(newCol, newRow);
    this.targetPixelX = targetPos.x;
    this.targetPixelY = targetPos.y;
    const dx = this.targetPixelX - this.startPixelX;
    const dy = this.targetPixelY - this.startPixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Gunakan kecepatan yang sama seperti hero (DEFAULT_MOVE_SPEED) untuk pergerakan
    this.moveDuration = Math.max((distance / 850) * 1000, 150);
    this.moveProgress = 0;
    this.isMoving = true;
  }

  update(deltaTime, grid) {
    // Jika enemy sedang bergerak, update posisi dengan interpolasi
    if (this.isMoving) {
      this.moveProgress += deltaTime / this.moveDuration;
      let t = Math.min(this.moveProgress, 1);
      let easedT = this.easeInOutQuad(t);
      this.pixelX = this.startPixelX + (this.targetPixelX - this.startPixelX) * easedT;
      this.pixelY = this.startPixelY + (this.targetPixelY - this.startPixelY) * easedT;
      if (t >= 1) {
        this.isMoving = false;
        this.col = this.targetCol;
        this.row = this.targetRow;
      }
    } else {
      // Jika tidak bergerak, sinkronkan posisi dengan cell grid
      const pos = grid.getCellPosition(this.col, this.row);
      this.pixelX = pos.x;
      this.pixelY = pos.y;
    }
    // Update animasi spritesheet
    this.updateAnimation(deltaTime);
  }

  render(ctx, grid, camera) {
    const pos = { x: this.pixelX, y: this.pixelY };
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
      const sourceX = this.frameIndex * FRAME_WIDTH;
      const sourceY = rowIndex * FRAME_HEIGHT;
      const drawX = cellCenterX - imgWidth / 2;
      const drawY = cellBottomY - imgHeight;
      // Terapkan efek grayscale jika enemy sudah bertindak
      let prevFilter = ctx.filter;
      if (this.actionTaken) {
        ctx.filter = "grayscale(100%)";
      }
      ctx.drawImage(
        this.image,
        sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT,
        drawX, drawY, imgWidth, imgHeight
      );
      ctx.filter = prevFilter;
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
    }
  }
}
