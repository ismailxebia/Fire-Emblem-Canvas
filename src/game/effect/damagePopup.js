// Floating damage numbers + status text (e.g. "MISS", "CRIT").
// Lives at game level, rendered above units.

export class DamagePopupManager {
  constructor() {
    this.popups = [];
  }

  /**
   * @param {number} pixelX - World x (cell top-left)
   * @param {number} pixelY - World y (cell top-left)
   * @param {number|string} value - number to show, or text like "MISS"
   * @param {object} opts - { color, fontSize, duration, riseDistance, isCrit }
   */
  spawn(pixelX, pixelY, value, opts = {}) {
    const isText = typeof value === 'string';
    const isCrit = opts.isCrit === true;
    this.popups.push({
      x: pixelX + (opts.offsetX ?? 0),
      y: pixelY + (opts.offsetY ?? -8),
      vx: opts.vx ?? 0,
      text: String(value),
      color: opts.color || (isText ? '#fff' : (value === 0 ? '#bbb' : '#ff5252')),
      stroke: opts.stroke || 'rgba(0,0,0,0.85)',
      fontSize: opts.fontSize || (isCrit ? 28 : 20),
      duration: opts.duration ?? (isCrit ? 1100 : 900),
      riseDistance: opts.riseDistance ?? 24,
      elapsed: 0,
      isText,
      isCrit,
    });
  }

  update(deltaTime) {
    if (!this.popups.length) return;
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.elapsed += deltaTime;
      if (p.elapsed >= p.duration) this.popups.splice(i, 1);
    }
  }

  render(ctx, camera) {
    if (!this.popups.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.popups) {
      const t = p.elapsed / p.duration;            // 0..1
      const ease = 1 - Math.pow(1 - t, 2);          // ease-out
      const offsetY = -ease * p.riseDistance;
      const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      const scale = p.isCrit ? (1 + 0.3 * (1 - ease)) : 1;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `bold ${p.fontSize * scale}px "Jersey 20", sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = p.stroke;
      ctx.fillStyle = p.color;
      const drawX = p.x - camera.x;
      const drawY = p.y - camera.y + offsetY;
      ctx.strokeText(p.text, drawX, drawY);
      ctx.fillText(p.text, drawX, drawY);
    }
    ctx.restore();
  }

  clear() {
    this.popups.length = 0;
  }
}
