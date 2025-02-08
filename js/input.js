// js/input.js
export function handleInput(game) {
  // Fungsi utilitas untuk membatasi nilai offset agar tidak keluar batas
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // --- Variabel untuk Drag/Click ---
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const dragThreshold = 5; // batas pergerakan (dalam pixel) untuk membedakan drag dari klik

  // Helper untuk menentukan hero yang akan dipindahkan.
  // Misalnya, kita gunakan hero pertama dari game.battle.heroes jika ada,
  // atau fallback ke game.hero (jika masih ada).
  function getSelectedHero() {
    if (game.battle && game.battle.heroes && game.battle.heroes.length > 0) {
      return game.battle.heroes[0];
    }
    return game.hero; // fallback jika belum menggunakan battle
  }

  // ============================
  // Mouse Events (Desktop)
  // ============================
  game.canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
  });

  game.canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Jika pergerakan melebihi threshold, anggap sebagai drag
    if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      hasMoved = true;
    }
    if (hasMoved) {
      // Update offset kamera (drag ke kanan = peta bergeser ke kiri, dst.)
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - game.canvas.width);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - game.canvas.height);
      // Perbarui titik awal untuk pergerakan berikutnya
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  game.canvas.addEventListener('mouseup', (e) => {
    // Jika tidak terjadi drag, anggap sebagai klik untuk memilih grid
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);
      // Gunakan hero yang dipilih (misalnya hero pertama)
      const selectedHero = getSelectedHero();
      if (selectedHero) {
        selectedHero.col = col;
        selectedHero.row = row;
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  // Jika pointer keluar dari canvas, batalkan drag
  game.canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    hasMoved = false;
  });

  // ============================
  // Touch Events (Mobile)
  // ============================
  game.canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      hasMoved = false;
    }
  });

  game.canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - startX;
    const dy = currentY - startY;

    if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      hasMoved = true;
    }
    if (hasMoved) {
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - game.canvas.width);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - game.canvas.height);
      startX = currentX;
      startY = currentY;
    }
    // Mencegah scroll bawaan browser
    e.preventDefault();
  }, { passive: false });

  game.canvas.addEventListener('touchend', (e) => {
    // Jika tidak terjadi drag, anggap sebagai tap untuk memilih grid
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = startX - rect.left;
      const y = startY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);
      const selectedHero = getSelectedHero();
      if (selectedHero) {
        selectedHero.col = col;
        selectedHero.row = row;
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  // ============================
  // Keyboard Scrolling (Opsional)
  // ============================
  window.addEventListener('keydown', (e) => {
    const scrollSpeed = 20;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    }
  });
}
