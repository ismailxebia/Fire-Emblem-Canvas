// FIRE-EMBLEM-CANVAS/js/utils/pathIndicator.js

/**
 * PathIndicator
 * -------------
 * Modul untuk merender jalur pathfinding di atas grid dengan custom assets:
 * - start:    titik awal
 * - end:      titik akhir
 * - straight: segmen lurus (orientasi default →)
 * - corners:  4 varian elbow/corner yang sudah pre-rotated
 *
 * corners key format: "dx1,dy1_dx2,dy2"
 *   dx1,dy1 = arah masuk (prev → cur)
 *   dx2,dy2 = arah keluar (cur → next)
 *
 * Contoh mapping corners:
 *   '1,0_0,1'   // masuk dari Timur (E), keluar ke Selatan (S)
 *   '0,1_1,0'   // masuk dari Selatan (S), keluar ke Timur (E)
 *   '-1,0_0,-1' // masuk dari Barat (W), keluar ke Utara (N)
 *   '0,-1_-1,0' // masuk dari Utara (N), keluar ke Barat (W)
 */
export class PathIndicator {
  /**
   * Render pathfinding arrows pada canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x:number,y:number}} camera
   * @param {Grid} grid
   * @param {Array<{col:number,row:number}>} path
   * @param {{
   *   start: Image,
   *   end: Image,
   *   straight: Image,
   *   corners: Record<string,Image>
   * }} sprites
   */
  static render(ctx, camera, grid, path, sprites) {
    if (!path || path.length < 2) return;

    path.forEach((node, i) => {
      // ► 1) Hitung koordinat center tile di world-space, lalu ke screen-space
      const { x, y } = grid.getCellPosition(node.col, node.row);
      const cx = x + grid.tileSize / 2 - camera.x;
      const cy = y + grid.tileSize / 2 - camera.y;

      let img, angle = 0;

      if (i === 0) {
        // ► Titik awal
        img = sprites.start;
        angle = this._angleBetween(node, path[i + 1]);
      } else if (i === path.length - 1) {
        // ► Titik akhir
        img = sprites.end;
        angle = this._angleBetween(path[i - 1], node);
      } else {
        // ► Segmen tengah: straight atau corner
        const prev = path[i - 1];
        const next = path[i + 1];
        const a1 = this._angleBetween(prev, node);
        const a2 = this._angleBetween(node, next);

        // Jika lurus (masuk & keluar searah), pakai straight + rotate
        if (Math.abs(a2 - a1) < 1e-3) {
          img = sprites.straight;
          angle = a1;
        } else {
          // ► Corner: pilih sprite dari pre-rotated corners map
          const dx1 = node.col - prev.col;
          const dy1 = node.row - prev.row;
          const dx2 = next.col - node.col;
          const dy2 = next.row - node.row;
          const key = `${dx1},${dy1}_${dx2},${dy2}`;
          img = sprites.corners[key];

          if (!img) {
            console.warn(`Corner sprite not found for key "${key}"`);
            return; // skip jika tidak ada mapping
          }
          // angle tetap 0 karena asset sudah pre-rotated
          angle = 0;
        }
      }

      // ► 2) Render image di center tile dengan rotasi (jika ada)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.drawImage(
        img,
        -grid.tileSize / 2,
        -grid.tileSize / 2,
        grid.tileSize,
        grid.tileSize
      );
      ctx.restore();
    });
  }

  /**
   * Hitung sudut (radian) dari node a ke node b.
   * Digunakan untuk orientasi start/end/straight.
   */
  static _angleBetween(a, b) {
    const dx = b.col - a.col;
    const dy = b.row - a.row;
    return Math.atan2(dy, dx);
  }
}
