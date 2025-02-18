// js/stage/stage01.js

/**
 * Fungsi untuk memuat data stage.
 * Data yang dikembalikan meliputi:
 * - backgroundUrl: URL gambar background untuk battle field.
 * - heroPositions: Array posisi default hero (maksimal 4 hero).
 * - enemyPositions: Array posisi default enemy (misalnya, maksimal 8 enemy).
 * - obstacles: Array posisi obstacle (collision), misalnya cell yang tidak dapat dilewati.
 */
export function loadStageData() {
  return {
    backgroundUrl: "https://ik.imagekit.io/ij05ikv7z/Hero/HD%20Back.png",
    battleName: "Battle of Armageddon",
    heroPositions: [
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 2, row: 3 },
      { col: 3, row: 3 }
    ],
    enemyPositions: [
      { col: 0, row: 8 },
      { col: 1, row: 8 },
      { col: 2, row: 9 },
      { col: 3, row: 8 },
      { col: 4, row: 8 },
      { col: 5, row: 9 },
      { col: 6, row: 8 },
      { col: 7, row: 8 }
    ],
    obstacles: [
      { col: 0, row: 1 },
      { col: 0, row: 2 },
      { col: 5, row: 1 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 4, row: 2 },
      { col: 4, row: 3 }
    ],
    // Konfigurasi efek opsional
    effects: {
      clouds: true,
      rain: true,
    }
  };
}
