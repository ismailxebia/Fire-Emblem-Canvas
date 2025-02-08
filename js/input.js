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

  // Helper: mencari hero di cell tertentu
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

      // Jika dalam mode move dan hero dipilih
      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        // Cek apakah cell yang diklik berada dalam jangkauan
        if (game.battle.pendingMove) {
          const origin = game.battle.pendingMove.originalPosition;
          const distance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
          if (distance > game.battle.selectedHero.movementRange) {
            // Jika di luar jangkauan, abaikan klik
            return;
          }
        }
        // Jika klik pada cell yang sama dengan posisi preview hero, batal mode move
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.pendingMove = null;
        } else {
          // Jika belum ada pendingMove, set originalPosition hero satu kali
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
            // Jika sudah ada, update hanya newPosition
            game.battle.pendingMove.newPosition = { col, row };
          }
          // Tampilkan preview perpindahan
          game.battle.selectedHero.col = col;
          game.battle.selectedHero.row = row;
          document.getElementById('confirmMenu').style.display = 'block';
        }
      }
      // Mode normal (tidak dalam mode move): proses seleksi hero
      else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          // Jika hero yang diklik sudah sama dengan hero yang dipilih, toggle deselect
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
          // Jika klik di cell kosong dan sedang dalam mode selected, batal seleksi
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
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = startX - rect.left;
      const y = startY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        // Cek apakah cell yang diklik berada dalam jangkauan
        if (game.battle.pendingMove) {
          const origin = game.battle.pendingMove.originalPosition;
          const distance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
          if (distance > game.battle.selectedHero.movementRange) {
            return;
          }
        }
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
          game.battle.selectedHero.col = col;
          game.battle.selectedHero.row = row;
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
