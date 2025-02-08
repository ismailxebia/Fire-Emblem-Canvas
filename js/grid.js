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
   * Menggambar grid lines dengan offset kamera (jika ada).
   * @param {CanvasRenderingContext2D} ctx - Context canvas.
   * @param {object} camera - Objek kamera { x, y }.
   */
  render(ctx, camera) {
    ctx.strokeStyle = 'rgb(235, 235, 235)';

    // Gambar garis vertikal (dari 0 hingga cols, sehingga menghasilkan cols+1 garis)
    for (let i = 0; i <= this.cols; i++) {
      const x = i * this.tileSize - camera.x;
      ctx.beginPath();
      ctx.moveTo(x, 0 - camera.y);
      ctx.lineTo(x, this.stageHeight - camera.y);
      ctx.stroke();
    }

    // Gambar garis horizontal
    for (let j = 0; j <= this.rows; j++) {
      const y = j * this.tileSize - camera.y;
      ctx.beginPath();
      ctx.moveTo(0 - camera.x, y);
      ctx.lineTo(this.stageWidth - camera.x, y);
      ctx.stroke();
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
