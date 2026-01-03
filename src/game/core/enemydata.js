// js/core/enemyData.js
import { Enemy } from '../entities/enemy.js';
import enemiesJson from '../data/enemies.json';

export async function loadEnemyData() {
  try {
    return Promise.resolve(enemiesJson.map(data => {
      return new Enemy(
        data.name,
        data.col,
        data.row,
        data.hp,
        data.atk,
        data.spriteUrl,
        data.hexRange,
        data.portraitUrl,
        data.level,
        data.star,
        data.spd,
        data.def,
        data.res
      );
    }));
  } catch (error) {
    console.error('Error loading enemy data:', error);
    return Promise.resolve([]);
  }
}
