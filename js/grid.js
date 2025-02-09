// js/grid.js
export default class Grid {
  /**
   * @param {number} cols - Jumlah kolom grid.
   * @param {number} rows - Jumlah baris grid.
   * @param {number} canvasWidth - Lebar canvas saat inisialisasi.
   */
  constructor(cols, rows, canvasWidth) {
    this.cols = cols;
    this.rows = rows;
    this.padding = 8; // Safe area padding 8px di sekeliling
    this.updateDimensions(canvasWidth);
    // Contoh obstacle
    this.obstacles = [
      { col: 1, row: 1 },
      { col: 2, row: 1 }
    ];
  }

  /**
   * Menghitung ulang tileSize dan dimensi stage berdasarkan lebar canvas.
   * Safe width = canvasWidth - (2 * padding).
   * StageWidth/StageHeight termasuk padding.
   * @param {number} canvasWidth - Lebar canvas yang baru.
   */
  updateDimensions(canvasWidth) {
    const safeWidth = canvasWidth - 2 * this.padding;
    this.tileSize = safeWidth / this.cols;
    // Stage (grid) akan memiliki ukuran: cell cell + padding di kedua sisi.
    this.stageWidth = this.tileSize * this.cols + 2 * this.padding;
    this.stageHeight = this.tileSize * this.rows + 2 * this.padding;
  }

  /**
   * Mengonversi koordinat grid (kolom, baris) ke posisi pixel.
   * Menggunakan padding sebagai offset.
   * @param {number} col - Kolom grid.
   * @param {number} row - Baris grid.
   * @returns {object} - Objek { x, y }.
   */
  getCellPosition(col, row) {
    return {
      x: this.padding + col * this.tileSize,
      y: this.padding + row * this.tileSize
    };
  }

  /**
   * Menggambar grid lines dan obstacle dengan offset kamera.
   * @param {CanvasRenderingContext2D} ctx - Context canvas.
   * @param {object} camera - Objek kamera { x, y }.
   */
  render(ctx, camera) {
    ctx.strokeStyle = 'rgb(235,235,235)';
    ctx.lineWidth = 1;
    // Gambar garis vertikal
    for (let i = 0; i <= this.cols; i++) {
      const x = this.padding + i * this.tileSize - camera.x;
      ctx.beginPath();
      ctx.moveTo(x, this.padding - camera.y);
      ctx.lineTo(x, this.padding + this.rows * this.tileSize - camera.y);
      ctx.stroke();
    }
    // Gambar garis horizontal
    for (let j = 0; j <= this.rows; j++) {
      const y = this.padding + j * this.tileSize - camera.y;
      ctx.beginPath();
      ctx.moveTo(this.padding - camera.x, y);
      ctx.lineTo(this.padding + this.cols * this.tileSize - camera.x, y);
      ctx.stroke();
    }
    // Gambar obstacle (jika ada)
    if (this.obstacles) {
      ctx.fillStyle = 'rgba(50,50,50,0.7)';
      this.obstacles.forEach(obstacle => {
        const pos = this.getCellPosition(obstacle.col, obstacle.row);
        ctx.fillRect(pos.x - camera.x, pos.y - camera.y, this.tileSize, this.tileSize);
      });
    }
  }
}
