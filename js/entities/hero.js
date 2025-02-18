// js/entities/hero.js

// Definisikan kecepatan default secara global (dalam pixel per detik)
const DEFAULT_MOVE_SPEED = 850;

// Ukuran frame pada spritesheet terpadu
const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 240;

// Konfigurasi aksi: tentukan baris dan jumlah frame untuk tiap aksi
const ACTION_CONFIG = {
  idle: { row: 0, frameCount: 4 },
  attack: { row: 1, frameCount: 4 },
  magicIdle: { row: 2, frameCount: 4 }
};

export class Hero {
  /**
   * Konstruktor Hero
   * Parameter:
   * @param {string} name - Nama hero.
   * @param {number} col - Posisi kolom pada grid.
   * @param {number} row - Posisi baris pada grid.
   * @param {number} health - Nilai kesehatan.
   * @param {number} attack - Nilai serangan.
   * @param {number} movementRange - Jangkauan pergerakan (dalam cell), default 3.
   * @param {string} spriteUrl - URL spritesheet terpadu hero.
   * @param {number} level - Level hero.
   * @param {number} star - Jumlah bintang/evolusi.
   * @param {number} spd - Kecepatan.
   * @param {number} def - Pertahanan.
   * @param {number} res - Resistensi.
   */
  constructor(
    name,
    col,
    row,
    health,
    attack,
    movementRange = 3,
    spriteUrl = "https://ik.imagekit.io/ij05ikv7z/Hero/Hero%20C.png",
    portraitUrl = "https://via.placeholder.com/80",
    level = 1,
    star = 1,
    spd,
    def,
    res
  ) {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.attack = attack;
    this.movementRange = movementRange;
    this.moveSpeed = DEFAULT_MOVE_SPEED;

    // Properti tambahan dari JSON
    this.level = level;
    this.star = star;
    this.spd = spd;       // Pastikan nilai ini dioper dari JSON
    this.def = def;       // Pastikan nilai ini dioper dari JSON
    this.res = res;       // Pastikan nilai ini dioper dari JSON

    // Pemuatan spritesheet terpadu
    this.spriteUrl = spriteUrl;
    this.portraitUrl = portraitUrl;
    this.image = new Image();
    this.image.src = spriteUrl;
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

    // Properti untuk animasi spritesheet
    this.currentAction = 'idle'; // Default aksi adalah "idle"
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 200; // Interval per frame (ms)

    // Flag untuk menandai apakah hero sudah bertindak pada turn ini.
    this.actionTaken = false;
  }

  // Fungsi easing untuk interpolasi (easeInOutQuad)
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Mulai animasi perpindahan ke grid cell baru
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
    this.moveDuration = Math.max((distance / this.moveSpeed) * 1000, 150);
    this.moveProgress = 0;
    this.isMoving = true;
  }

  // Update animasi perpindahan hero dan animasi spritesheet
  update(deltaTime, grid) {
    this.updateAnimation(deltaTime);
    if (!this.isMoving) {
      const pos = grid.getCellPosition(this.col, this.row);
      this.pixelX = pos.x;
      this.pixelY = pos.y;
    } else {
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
    }
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

  // Render hero menggunakan spritesheet terpadu.
  render(ctx, grid, camera) {
    const pos = { x: this.pixelX, y: this.pixelY };
    const cellCenterX = pos.x + grid.tileSize / 2 - camera.x;
    const cellBottomY = pos.y + grid.tileSize - camera.y;

    if (this.image.complete && this.image.naturalWidth > 0) {
      const config = ACTION_CONFIG[this.currentAction] || ACTION_CONFIG.idle;
      const rowIndex = config.row;
      const desiredHeight = grid.tileSize * 1.2;
      const scale = desiredHeight / FRAME_HEIGHT;
      const imgHeight = FRAME_HEIGHT * scale;
      const imgWidth = FRAME_WIDTH * scale;
      const sourceX = this.frameIndex * FRAME_WIDTH;
      const sourceY = rowIndex * FRAME_HEIGHT;
      const drawX = cellCenterX - imgWidth / 2;
      const drawY = cellBottomY - imgHeight;

      // Jika hero sudah bertindak, terapkan efek grayscale
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
      ctx.fillStyle = 'blue';
      ctx.fillRect(pos.x - camera.x, pos.y - camera.y, grid.tileSize, grid.tileSize);
    }
  }
}
