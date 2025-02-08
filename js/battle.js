// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

export default class Battle {
    constructor(grid) {
        this.grid = grid;

        // Inisialisasi heroes (contoh: variasi movementRange)
        this.heroes = [
            new Hero('HeroA', 2, 2, 100, 20, 3), // range 3
            new Hero('HeroB', 3, 2, 90, 18, 2),  // range 2
            new Hero('HeroC', 2, 3, 80, 25, 1),  // range 1
            new Hero('HeroD', 3, 3, 70, 15, 3)   // range 3
        ];

        // Inisialisasi enemies
        this.enemies = [
            new Enemy('Enemy1', 0, 19, 50, 15),
            new Enemy('Enemy2', 1, 19, 60, 18),
            new Enemy('Enemy3', 2, 19, 40, 12),
            new Enemy('Enemy4', 3, 19, 80, 20)
        ];

        // Sinkronkan posisi pixel untuk masing-masing hero
        this.heroes.forEach(hero => {
            const pos = this.grid.getCellPosition(hero.col, hero.row);
            hero.pixelX = pos.x;
            hero.pixelY = pos.y;
        });

        // Properti tambahan untuk state pertarungan
        this.currentTurn = 'hero'; // 'hero' atau 'enemy'
        this.selectedHero = null;  // Hero yang dipilih
        this.actionMode = 'normal'; // 'normal', 'selected', atau 'move'
        this.pendingMove = null;    // { hero, originalPosition: {col, row}, newPosition: {col, row} }
    }

    update(deltaTime) {
        // Update setiap hero (termasuk animasi perpindahan)
        this.heroes.forEach(hero => {
          if (hero.health > 0) {
            hero.update(deltaTime, this.grid);
          }
        });
        // Update logika enemy jika ada...
      }

    render(ctx, camera) {
        // Render grid, heroes, dan enemy (sudah ada)
        this.heroes.forEach(hero => {
            if (hero.health > 0) {
                hero.render(ctx, this.grid, camera);
            }
        });
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                enemy.render(ctx, this.grid, camera);
            }
        });

        // Render indikator hero yang dipilih
        if (this.selectedHero) {
            const pos = this.grid.getCellPosition(this.selectedHero.col, this.selectedHero.row);
            ctx.save();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.strokeRect(pos.x - camera.x, pos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            ctx.restore();
        }

        // Jika dalam mode 'move' dan pendingMove sudah diset, gambar indikator range
        // Di dalam method render() di battle.js, setelah menggambar hex range indicator:
        if (this.actionMode === 'move' && this.pendingMove) {
            // Gambar indikator hex range (misalnya overlay untuk semua cell dalam jangkauan)
            const origin = this.pendingMove.originalPosition;
            const range = this.pendingMove.hero.movementRange;
            for (let c = 0; c < this.grid.cols; c++) {
                for (let r = 0; r < this.grid.rows; r++) {
                    const distance = Math.abs(c - origin.col) + Math.abs(r - origin.row);
                    if (distance <= range) {
                        const cellPos = this.grid.getCellPosition(c, r);
                        ctx.save();
                        ctx.fillStyle = 'rgba(0, 0, 255, 0.15)'; // Overlay biru muda transparan
                        ctx.fillRect(cellPos.x - camera.x, cellPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
                        ctx.restore();
                    }
                }
            }

            // Gambar indikator posisi asli (original position) sebagai kotak dashed
            const origPos = this.grid.getCellPosition(origin.col, origin.row);
            ctx.save();
            ctx.strokeStyle = 'blue';    // Warna hijau untuk indikator
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);       // Garis dashed
            ctx.strokeRect(origPos.x - camera.x, origPos.y - camera.y, this.grid.tileSize, this.grid.tileSize);
            ctx.restore();
        }
    }
}