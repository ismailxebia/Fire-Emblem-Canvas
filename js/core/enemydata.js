// js/core/enemyData.js
import { Enemy } from '../entities/enemy.js';

export async function loadEnemyData() {
  try {
    const response = await fetch('/js/data/enemies.json');
    if (!response.ok) {
      throw new Error('Gagal memuat data enemy');
    }
    const enemiesJson = await response.json();
    // Konversi data JSON ke instance Enemy
    const enemies = enemiesJson.map(data => {
      return new Enemy(
        data.name,
        data.col,
        data.row,
        data.hp,
        data.atk,
        data.spriteUrl,  // Gunakan spriteUrl dari JSON
        data.hexRange  // atau data.movementRange, sesuai kebutuhan
      );
    });
    return enemies;
  } catch (error) {
    console.error('Error loading enemy data:', error);
    return [];
  }
}
