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
        data.spriteUrl,    // spriteUrl dari JSON
        data.hexRange,     // hexRange dari JSON
        data.portraitUrl,  // portraitUrl untuk profile status
        data.level,        // level
        data.star,         // star
        data.spd,          // spd
        data.def,          // def
        data.res           // res
      );
    });
    return enemies;
  } catch (error) {
    console.error('Error loading enemy data:', error);
    return [];
  }
}
