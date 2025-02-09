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
    this.updateDimensions(canvasWidth);
    // Tambahkan obstacle yang diinginkan
    // Contoh: obstacle di cell (5,4) dan (8,4)
    this.obstacles = [
      { col: 1, row: 1 },
      { col: 2, row: 1 }
    ];
  }

  /**
   * Menghitung ulang tileSize dan dimensi stage berdasarkan lebar canvas.
   * @param {number} canvasWidth - Lebar canvas yang baru.
   */
  updateDimensions(canvasWidth) {
    // Gunakan pembagian tepat agar grid menyesuaikan lebar canvas
    this.tileSize = canvasWidth / this.cols;
    // Pastikan stageWidth didasarkan pada tileSize * jumlah kolom
    this.stageWidth = this.tileSize * this.cols;
    this.stageHeight = this.rows * this.tileSize;
  }

  /**
   * Menggambar grid lines dan obstacle dengan offset kamera (jika ada).
   * @param {CanvasRenderingContext2D} ctx - Context canvas.
   * @param {object} camera - Objek kamera { x, y }.
   */
  render(ctx, camera) {
    // Gambar grid lines
    ctx.strokeStyle = 'rgb(235, 235, 235)';
    ctx.lineWidth = 1;
    // Garis vertikal
    for (let i = 0; i <= this.cols; i++) {
      const x = i * this.tileSize - camera.x;
      ctx.beginPath();
      ctx.moveTo(x, 0 - camera.y);
      ctx.lineTo(x, this.stageHeight - camera.y);
      ctx.stroke();
    }
    // Garis horizontal
    for (let j = 0; j <= this.rows; j++) {
      const y = j * this.tileSize - camera.y;
      ctx.beginPath();
      ctx.moveTo(0 - camera.x, y);
      ctx.lineTo(this.stageWidth - camera.x, y);
      ctx.stroke();
    }

    // Gambar obstacle (jika ada) agar terlihat di atas grid
    if (this.obstacles) {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.7)'; // Warna gelap untuk obstacle
      this.obstacles.forEach(obstacle => {
        const pos = this.getCellPosition(obstacle.col, obstacle.row);
        ctx.fillRect(pos.x - camera.x, pos.y - camera.y, this.tileSize, this.tileSize);
      });
    }
  }

  /**
   * Mengonversi koordinat grid (kolom, baris) ke posisi pixel.
   * @param {number} col - Kolom grid.
   * @param {number} row - Baris grid.
   * @returns {object} - Objek { x, y }.
   */
  getCellPosition(col, row) {
    return {
      x: col * this.tileSize,
      y: row * this.tileSize
    };
  }
}
