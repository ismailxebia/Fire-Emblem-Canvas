// js/core/heroData.js
import { Hero } from '../entities/hero.js';

export async function loadHeroData() {
  try {
    const response = await fetch('/js/data/heroes.json');
    if (!response.ok) {
      throw new Error('Gagal memuat data hero');
    }
    const heroesJson = await response.json();
    // Konversi setiap data JSON ke instance Hero
    const heroes = heroesJson.map(data => {
      return new Hero(
        data.name,
        data.col,
        data.row,
        data.hp,
        data.atk,
        data.hexRange,  // atau data.movementRange, sesuai kebutuhan
        data.spriteUrl
      );
    });
    return heroes;
  } catch (error) {
    console.error('Error loading hero data:', error);
    return [];
  }
}
