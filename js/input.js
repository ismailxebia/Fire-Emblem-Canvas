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

  // Helper: mencari unit (hero atau enemy) di cell tertentu
  function getUnitAtCell(col, row) {
    // Cari hero
    for (let hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    // Cari enemy
    for (let enemy of game.battle.enemies) {
      if (enemy.col === col && enemy.row === row) return enemy;
    }
    return null;
  }

  // Helper: mencari hero saja (untuk seleksi normal)
  function getHeroAtCell(col, row) {
    for (let hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    return null;
  }

  // ================= Mouse Events (Desktop) =================
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

      // MODE MOVE: jika hero sudah dipilih dan mode aksi adalah 'move'
      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        // Ambil titik awal (origin) dari pendingMove jika ada, atau dari posisi hero saat ini
        const origin = game.battle.pendingMove
          ? game.battle.pendingMove.originalPosition
          : { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row };

        // Periksa jarak Manhattan dari origin ke target
        const manhattanDistance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
        if (manhattanDistance > game.battle.selectedHero.movementRange) return;

        // Cek apakah cell target sudah ditempati oleh unit lain (baik hero maupun enemy)
        const occupyingUnit = getUnitAtCell(col, row);
        if (occupyingUnit && occupyingUnit !== game.battle.selectedHero) return;

        // Gunakan fungsi pathfinding untuk memastikan target cell dapat dijangkau
        const path = game.battle.findPath(game.grid, origin, { col, row }, game.battle.selectedHero.movementRange);
        if (path.length === 0 || (path.length - 1) > game.battle.selectedHero.movementRange) return;

        // Jika klik pada cell yang sama dengan posisi preview hero, batalkan mode move
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.pendingMove = null;
        } else {
          // Simpan pendingMove (simpan original dan update newPosition)
          if (!game.battle.pendingMove) {
            game.battle.pendingMove = {
              hero: game.battle.selectedHero,
              originalPosition: {
                col: game.battle.selectedHero.col,
                row: game.battle.selectedHero.row
              },
              newPosition: { col, row }
            };
          } else {
            game.battle.pendingMove.newPosition = { col, row };
          }
          game.battle.selectedHero.startMove(game.grid, col, row);
          document.getElementById('confirmMenu').style.display = 'block';
        }
      }
      // MODE NORMAL: proses seleksi/deseleksi hero
      else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          if (game.battle.selectedHero && game.battle.selectedHero === clickedHero) {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
          } else {
            game.battle.selectedHero = clickedHero;
            game.battle.actionMode = 'selected';
            document.getElementById('actionMenu').style.display = 'block';
          }
        } else {
          if (game.battle.actionMode === 'selected') {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
          }
        }
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  // ================= Touch Events (Mobile) =================
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
    e.preventDefault();
    if (!hasMoved && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const rect = game.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);
      
      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        const origin = game.battle.pendingMove
          ? game.battle.pendingMove.originalPosition
          : { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row };
        const manhattanDistance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
        if (manhattanDistance > game.battle.selectedHero.movementRange) return;
  
        const occupyingUnit = getUnitAtCell(col, row);
        if (occupyingUnit && occupyingUnit !== game.battle.selectedHero) return;
  
        const path = game.battle.findPath(game.grid, origin, { col, row }, game.battle.selectedHero.movementRange);
        if (path.length === 0 || (path.length - 1) > game.battle.selectedHero.movementRange) return;
  
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.pendingMove = null;
        } else {
          if (!game.battle.pendingMove) {
            game.battle.pendingMove = {
              hero: game.battle.selectedHero,
              originalPosition: {
                col: game.battle.selectedHero.col,
                row: game.battle.selectedHero.row
              },
              newPosition: { col, row }
            };
          } else {
            game.battle.pendingMove.newPosition = { col, row };
          }
          game.battle.selectedHero.startMove(game.grid, col, row);
          document.getElementById('confirmMenu').style.display = 'block';
        }
      } else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          if (game.battle.selectedHero && game.battle.selectedHero === clickedHero) {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
          } else {
            game.battle.selectedHero = clickedHero;
            game.battle.actionMode = 'selected';
            document.getElementById('actionMenu').style.display = 'block';
          }
        } else {
          if (game.battle.actionMode === 'selected') {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
          }
        }
      }
    }
    isDragging = false;
    hasMoved = false;
  });

  // ================= Keyboard Scrolling (Optional) =================
  window.addEventListener('keydown', (e) => {
    const scrollSpeed = 20;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    }
  });
}
