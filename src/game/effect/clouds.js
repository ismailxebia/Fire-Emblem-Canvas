// Tileable cloud-shadow pattern, with two layered patterns at different
// scales / parallax / speeds so the seam of one layer is masked by the
// motion of the other.

function buildCloudCanvas(width, height, count, blur, alpha) {
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const ctx = off.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.filter = `blur(${blur}px)`;

    const drawWrapped = (x, y, radius, color) => {
        const fill = (xPos, yPos) => {
            ctx.beginPath();
            ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        };
        fill(x, y);
        // Wrap on all 8 edges/corners so blur doesn't cut at boundaries
        const wrapMargin = radius + blur * 2;
        if (x + wrapMargin > width) fill(x - width, y);
        if (x - wrapMargin < 0) fill(x + width, y);
        if (y + wrapMargin > height) fill(x, y - height);
        if (y - wrapMargin < 0) fill(x, y + height);
        if (x + wrapMargin > width && y + wrapMargin > height) fill(x - width, y - height);
        if (x - wrapMargin < 0 && y + wrapMargin > height) fill(x + width, y - height);
        if (x + wrapMargin > width && y - wrapMargin < 0) fill(x - width, y + height);
        if (x - wrapMargin < 0 && y - wrapMargin < 0) fill(x + width, y + height);
    };

    for (let i = 0; i < count; i++) {
        const radius = 25 + Math.random() * 50;
        const x = Math.random() * width;
        const y = Math.random() * height;
        drawWrapped(x, y, radius, `rgba(0, 0, 0, ${alpha})`);
    }

    ctx.filter = 'none';
    return off;
}

export default class CloudEffect {
    constructor(width, height) {
        // Pattern canvas larger than stage → seam appears less often
        this.width = Math.max(width, 800) * 1.5;
        this.height = Math.max(height, 600) * 1.5;

        // Two layers at different scales/speeds. Layer A is the main
        // shadow, B is a slower/darker accent that breaks up A's seam.
        this.layerA = {
            canvas: buildCloudCanvas(this.width, this.height, 110, 16, 0.32),
            offsetX: 0,
            speed: 0.020,        // px per ms
            parallax: 0.20,
            alpha: 0.45,
        };
        this.layerB = {
            canvas: buildCloudCanvas(this.width * 0.7, this.height * 0.7, 60, 24, 0.22),
            offsetX: Math.random() * this.width,
            speed: 0.012,        // slower
            parallax: 0.08,      // less parallax (further away feel)
            alpha: 0.30,
        };
        this.layerA.pattern = this.layerA.canvas.getContext('2d').createPattern(this.layerA.canvas, 'repeat');
        this.layerB.pattern = this.layerB.canvas.getContext('2d').createPattern(this.layerB.canvas, 'repeat');
    }

    update(deltaTime) {
        this.layerA.offsetX += deltaTime * this.layerA.speed;
        this.layerB.offsetX += deltaTime * this.layerB.speed;
        // Wrap modulo to avoid float blow-up
        if (this.layerA.offsetX > this.width) this.layerA.offsetX -= this.width;
        const bw = this.layerB.canvas.width;
        if (this.layerB.offsetX > bw) this.layerB.offsetX -= bw;
    }

    _renderLayer(ctx, camera, layer) {
        const cw = ctx.canvas.clientWidth || ctx.canvas.width;
        const ch = ctx.canvas.clientHeight || ctx.canvas.height;
        const lw = layer.canvas.width;
        const lh = layer.canvas.height;

        let offsetX = (layer.offsetX - camera.x * layer.parallax) % lw;
        if (offsetX < 0) offsetX += lw;
        let offsetY = (-camera.y * layer.parallax) % lh;
        if (offsetY < 0) offsetY += lh;

        ctx.save();
        ctx.globalAlpha = layer.alpha;
        ctx.fillStyle = layer.pattern;
        ctx.translate(-offsetX, -offsetY);
        // Cover viewport (+ overflow for safety)
        ctx.fillRect(offsetX, offsetY, cw + lw, ch + lh);
        ctx.restore();
    }

    render(ctx, camera) {
        this._renderLayer(ctx, camera, this.layerB); // back layer first
        this._renderLayer(ctx, camera, this.layerA); // main layer on top
    }

    destroy() {
        this.layerA = null;
        this.layerB = null;
    }
}
