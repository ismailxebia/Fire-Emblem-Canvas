// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

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

    // Inisialisasi 4 enemy dengan posisi yang diinginkan (misalnya, di baris paling bawah)
    this.enemies = [
      new Enemy('Enemy1', 0, 19, 50, 15),
      new Enemy('Enemy2', 1, 19, 60, 18),
      new Enemy('Enemy3', 2, 19, 40, 12),
      new Enemy('Enemy4', 3, 19, 80, 20)
    ];

    // Properti tambahan untuk manajemen turn dan aksi:
    this.currentTurn = 'hero'; // bisa 'hero' atau 'enemy'
    this.selectedHero = null;  // menyimpan hero yang saat ini dipilih
    this.actionMode = 'normal'; // mode aksi: 'normal', 'selected', atau 'move'
    this.pendingMove = null;    // objek untuk menyimpan informasi perpindahan, misal:
                                // { hero, originalPosition: {col, row}, newPosition: {col, row} }
  }

  update(deltaTime) {
    // Placeholder untuk update logika pertarungan, aksi, dan giliran.
    // Misalnya, jika giliran enemy, Anda bisa mengimplementasikan logika AI di sini.
    if (this.currentTurn === 'enemy') {
      // Contoh: jalankan update AI untuk enemy
      // this.enemies.forEach(enemy => enemy.update(deltaTime, this.grid));
    }
    // Update animasi atau efek tambahan bisa ditaruh di sini.
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

    // Render indikator seleksi hero (misalnya, kotak kuning) jika ada hero yang dipilih
    if (this.selectedHero) {
      const pos = this.grid.getCellPosition(this.selectedHero.col, this.selectedHero.row);
      ctx.save();
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 3;
      ctx.strokeRect(pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      ctx.restore();
    }

    // Jika dalam mode move dan ada pendingMove, gambar indikator posisi asli hero
    if (this.actionMode === 'move' && this.pendingMove) {
      const origPos = this.grid.getCellPosition(
        this.pendingMove.originalPosition.col,
        this.pendingMove.originalPosition.row
      );
      ctx.save();
      // Contoh: kotak dashed berwarna hijau untuk menandai posisi awal hero
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(origPos.x - camera.x, origPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
      ctx.restore();
    }
  }
}
