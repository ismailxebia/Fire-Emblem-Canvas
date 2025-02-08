// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';  // Pastikan Enemy diimpor sesuai dengan cara diekspor

export default class Battle {
  constructor(grid) {
    this.grid = grid;

    // Inisialisasi 4 heroes dengan posisi awal yang diinginkan
    this.heroes = [
      new Hero('HeroA', 2, 2, 100, 20),
      new Hero('HeroB', 3, 2, 90, 18),
      new Hero('HeroC', 2, 3, 80, 25),
      new Hero('HeroD', 3, 3, 70, 15)
    ];

    // Inisialisasi 4 enemies dengan posisi yang diinginkan (misalnya, di baris paling bawah)
    this.enemies = [
      new Enemy('Enemy1', 0, 19, 50, 15),
      new Enemy('Enemy2', 1, 19, 60, 18),
      new Enemy('Enemy3', 2, 19, 40, 12),
      new Enemy('Enemy4', 3, 19, 80, 20)
    ];

    // Properti tambahan untuk manajemen turn dan aksi:
    this.currentTurn = 'hero'; // Bisa 'hero' atau 'enemy'
    this.selectedHero = null;  // Menyimpan hero yang saat ini dipilih
    this.actionMode = 'normal'; // Mode aksi: 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // Objek untuk menyimpan informasi perpindahan (jika sedang dalam mode move)
  }

  update(deltaTime) {
    // Placeholder untuk update logika pertarungan, aksi, dan giliran.
    // Misalnya, jika giliran enemy, Anda bisa mengimplementasikan logika AI di sini.
    if (this.currentTurn === 'enemy') {
      // Contoh: untuk tiap enemy, jalankan fungsi AI (belum diimplementasikan)
      // this.enemies.forEach(enemy => enemy.update(deltaTime, this.grid));
    }
    // Update animasi atau efek tambahan bisa diletakkan di sini.
  }

  render(ctx, camera) {
    // Render semua hero yang masih hidup
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.render(ctx, this.grid, camera);
      }
    });

    // Render semua enemy yang masih hidup
    this.enemies.forEach(enemy => {
      if (enemy.health > 0) {
        enemy.render(ctx, this.grid, camera);
      }
    });

    // Render indikator seleksi jika ada hero yang dipilih
    if (this.selectedHero) {
      const pos = this.grid.getCellPosition(this.selectedHero.col, this.selectedHero.row);
      ctx.save();
      ctx.strokeStyle = 'yellow';  // Warna indikator seleksi
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      ctx.restore();
    }
  }
}
