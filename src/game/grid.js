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
    this.obstacles = [];
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
  render(_ctx, _camera) {
    // Grid lines and obstacle overlay intentionally omitted —
    // background image handles the visual grid.
  }
}
