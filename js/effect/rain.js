// js/effects/rain.js
export default class RainEffect {
    constructor(width, height, count = 300) {
      this.width = width;
      this.height = height;
      this.count = count;
      this.particles = [];
      // Tambahkan properti wind (dalam radian) untuk menentukan kemiringan hujan
      // Misal: 0.2 radian (~11,5°) untuk miring ke kanan
      this.wind = -0.2;
      
      // Buat canvas offscreen untuk efek hujan
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'rainCanvas';
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.pointerEvents = 'none';
      // Pastikan hujan muncul di atas background tapi tidak mengganggu grid
      this.canvas.style.zIndex = '2';
      
      // Sisipkan canvas hujan ke dalam container (#canvasContainer)
      const container = document.getElementById('canvasContainer');
      container.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
      
      // Inisialisasi partikel hujan
      for (let i = 0; i < this.count; i++) {
        this.particles.push(this.createParticle());
      }
    }
  
    createParticle() {
      return {
        // Posisi acak dalam area
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        // Panjang raindrop antara 10 dan 20 piksel
        length: 10 + Math.random() * 10,
        // Kecepatan vertikal (jatuh) antara 300-500 piksel per detik
        speedY: 300 + Math.random() * 200,
        // Kecepatan horizontal (drift) sedikit acak
        speedX: (Math.random() - 0.5) * 20,
        // Opasitas acak antara 0.3-0.6
        opacity: 0.3 + Math.random() * 0.3,
        // Tetapkan sudut secara tetap, tanpa variasi random
        angle: this.wind
      };
    }
  
    update(deltaTime, camera) {
      // deltaTime dalam ms; konversi ke detik
      const dt = deltaTime * 0.001;
      for (let i = 0; i < this.count; i++) {
        let p = this.particles[i];
        p.x += p.speedX * dt;
        p.y += p.speedY * dt;
        
        // Jika raindrop sudah jatuh di bawah area, reset ke atas secara acak
        if (p.y > this.height) {
          p.y = -p.length;
          p.x = Math.random() * this.width;
        }
        // Wrap horizontal: jika keluar di kanan/kiri, balikan
        if (p.x > this.width) p.x -= this.width;
        else if (p.x < 0) p.x += this.width;
      }
    }
  
    render() {
      // Bersihkan canvas hujan
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Gambar setiap raindrop sebagai garis dengan sudut tetap
      for (let i = 0; i < this.count; i++) {
        let p = this.particles[i];
        this.ctx.beginPath();
        // Hitung offset berdasarkan sudut tetap
        const dx = p.length * Math.sin(p.angle);
        const dy = p.length * Math.cos(p.angle);
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + dx, p.y + dy);
        this.ctx.strokeStyle = `rgba(200,200,255,${p.opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }
  