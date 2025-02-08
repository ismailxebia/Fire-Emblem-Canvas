// js/input.js
export function handleInput(game) {
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const dragThreshold = 5;

  // Helper: cari hero yang berada pada cell tertentu
  function getHeroAtCell(col, row) {
    for (let hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    return null;
  }

  // ================= Mouse Events =================
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
    if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      hasMoved = true;
    }
    if (hasMoved) {
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - game.canvas.width);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - game.canvas.height);
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  game.canvas.addEventListener('mouseup', (e) => {
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        // Jika klik pada cell yang sama dengan posisi hero, batal mode move
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
        } else {
          // Set pending move: simpan posisi awal dan target baru
          game.battle.pendingMove = {
            hero: game.battle.selectedHero,
            originalPosition: { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row },
            newPosition: { col, row }
          };
          // Gerakkan hero secara preview ke posisi baru
          game.battle.selectedHero.col = col;
          game.battle.selectedHero.row = row;
          // Tampilkan confirm menu
          const confirmMenu = document.getElementById('confirmMenu');
          confirmMenu.style.display = 'block';
        }
      } else {
        // Mode normal: cek apakah ada hero di cell yang diklik
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          game.battle.selectedHero = clickedHero;
          game.battle.actionMode = 'selected';
          // Tampilkan floating action menu
          const actionMenu = document.getElementById('actionMenu');
          actionMenu.style.display = 'block';
        }
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  // (Pastikan juga implementasi touch events disesuaikan dengan logika di atas)
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
    e.preventDefault();
  }, { passive: false });

  game.canvas.addEventListener('touchend', (e) => {
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = startX - rect.left;
      const y = startY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);
      
      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
        } else {
          game.battle.pendingMove = {
            hero: game.battle.selectedHero,
            originalPosition: { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row },
            newPosition: { col, row }
          };
          game.battle.selectedHero.col = col;
          game.battle.selectedHero.row = row;
          const confirmMenu = document.getElementById('confirmMenu');
          confirmMenu.style.display = 'block';
        }
      } else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          game.battle.selectedHero = clickedHero;
          game.battle.actionMode = 'selected';
          const actionMenu = document.getElementById('actionMenu');
          actionMenu.style.display = 'block';
        }
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  window.addEventListener('keydown', (e) => {
    const scrollSpeed = 20;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    }
  });
}
