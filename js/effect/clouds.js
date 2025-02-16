export default class CloudEffect {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        // Buat canvas offscreen untuk pola bayangan awan
        this.offscreen = document.createElement('canvas');
        this.offscreen.width = width;
        this.offscreen.height = height;
        this.ctx = this.offscreen.getContext('2d');
        this.offsetX = 0;
        // Buat pola awan secara tileable dan seamless
        this.generateCloudPattern();
    }

    generateCloudPattern() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        // Terapkan filter blur untuk membuat bayangan lebih lembut
        ctx.filter = 'blur(14px)';

        // Gambar sejumlah lingkaran secara acak (misalnya, 70 buah)
        const count = 80;
        for (let i = 0; i < count; i++) {
            const radius = 20 + Math.random() * 30;
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.drawCircle(ctx, x, y, radius, 'rgba(0, 0, 0, 0.35)');
        }

        // Reset filter
        ctx.filter = 'none';

        // Buat pattern yang dapat diulang secara seamless
        this.pattern = ctx.createPattern(this.offscreen, 'repeat');
    }

    // Fungsi untuk menggambar lingkaran dan duplikatnya di tepi agar pola tileable
    drawCircle(ctx, x, y, radius, color) {
        const draw = (xPos, yPos) => {
            ctx.beginPath();
            ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        };

        // Gambar lingkaran di posisi asli
        draw(x, y);
        // Jika mendekati batas kanan atau kiri, gambar duplikat
        if (x + radius > this.width) draw(x - this.width, y);
        if (x - radius < 0) draw(x + this.width, y);
        // Jika mendekati batas bawah atau atas, gambar duplikat
        if (y + radius > this.height) draw(x, y - this.height);
        if (y - radius < 0) draw(x, y + this.height);
        // Jika mendekati sudut, gambar duplikat di keempat sudut
        if (x + radius > this.width && y + radius > this.height) draw(x - this.width, y - this.height);
        if (x - radius < 0 && y + radius > this.height) draw(x + this.width, y - this.height);
        if (x + radius > this.width && y - radius < 0) draw(x - this.width, y + this.height);
        if (x - radius < 0 && y - radius < 0) draw(x + this.width, y + this.height);
    }

    update(deltaTime) {
        // Geser pola awan secara perlahan ke kanan (kecepatan 0.02 pixel per ms)
        this.offsetX += deltaTime * 0.02;
        if (this.offsetX > this.width) {
            this.offsetX -= this.width;
        }
    }

    render(ctx, camera) {
        ctx.save();
        ctx.globalAlpha = 0.5; // Transparansi bayangan

        const parallaxFactor = 0.2;
        // Hitung offset horizontal dengan parallax
        let effectiveOffsetX = (this.offsetX - camera.x * parallaxFactor) % this.width;
        if (effectiveOffsetX < 0) effectiveOffsetX += this.width;
        // Hitung offset vertikal berdasarkan camera.y
        let effectiveOffsetY = (- camera.y * parallaxFactor) % this.height;
        if (effectiveOffsetY < 0) effectiveOffsetY += this.height;

        ctx.fillStyle = this.pattern;
        // Terapkan transformasi agar pattern ikut bergeser secara horizontal dan vertikal
        ctx.translate(-effectiveOffsetX, -effectiveOffsetY);
        // Isi area yang cukup untuk memastikan pola tidak terlihat terpotong
        ctx.fillRect(effectiveOffsetX, effectiveOffsetY, this.width * 2, this.height * 2);
        ctx.restore();
    }
}
