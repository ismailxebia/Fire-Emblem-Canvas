// js/core/heroData.js
import { Hero } from '../entities/hero.js';
import heroesJson from '../data/heroes.json';

export async function loadHeroData() {
  try {
    // Return promise to maintain signature compatibility
    return Promise.resolve(heroesJson.map(data => {
      return new Hero(
        data.name,
        data.col,
        data.row,
        data.hp,
        data.atk,
        data.hexRange,
        data.spriteUrl,
        data.portraitUrl,
        data.level,
        data.star,
        data.spd,
        data.def,
        data.res,
        data.attackRange
      );
    }));
  } catch (error) {
    console.error('Error loading hero data:', error);
    return Promise.resolve([]);
  }
}
