// js/battle.js
import { Hero } from './entities/hero.js';
import { Enemy } from './entities/enemy.js';

export default class Battle {
  constructor(grid) {
    this.grid = grid;
    
    // Inisialisasi 4 heroes dengan posisi yang diinginkan.
    // Misalnya, hero "A" di kolom 2, baris 2; hero "B" di kolom 3, baris 2; dan seterusnya.
    this.heroes = [
      new Hero('HeroA', 2, 2, 100, 20),
      new Hero('HeroB', 3, 2, 90, 18),
      new Hero('HeroC', 2, 3, 80, 25),
      new Hero('HeroD', 3, 3, 70, 15)
    ];
    
    // Inisialisasi 4 enemy dengan posisi yang diinginkan (misalnya di baris paling bawah)
    this.enemies = [
      new Enemy('Enemy1', 0, 19, 50, 15),
      new Enemy('Enemy2', 1, 19, 60, 18),
      new Enemy('Enemy3', 2, 19, 40, 12),
      new Enemy('Enemy4', 3, 19, 80, 20)
    ];
    
    // Properti tambahan untuk giliran pertarungan, dsb.
    this.currentTurn = 'hero';
  }
  
  update(deltaTime) {
    // Update logika pertarungan, aksi, giliran, dsb.
  }
  
  render(ctx, camera) {
    // Render heroes
    this.heroes.forEach(hero => {
      if (hero.health > 0) {
        hero.render(ctx, this.grid, camera);
      }
    });
    
    // Render enemies
    this.enemies.forEach(enemy => {
      if (enemy.health > 0) {
        enemy.render(ctx, this.grid, camera);
      }
    });
  }
}
