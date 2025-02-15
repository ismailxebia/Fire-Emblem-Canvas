// js/input.js
import { updateProfileStatus } from './ui.js';

export function handleInput(game) {
  // Fungsi pembantu untuk membatasi nilai
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Fungsi pembantu untuk mencari hero di suatu cell
  function getHeroAtCell(col, row) {
    for (const hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    return null;
  }

  // Fungsi pembantu untuk mencari unit (hero atau enemy) di suatu cell
  function getUnitAtCell(col, row) {
    const hero = getHeroAtCell(col, row);
    if (hero) return hero;
    for (const enemy of game.battle.enemies) {
      if (enemy.col === col && enemy.row === row) return enemy;
    }
    return null;
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const dragThreshold = 15; // threshold untuk membedakan antara tap dan drag

  // Gunakan Pointer Events untuk menangani input (mouse & touch)
  game.canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
    // Tangkap pointer sehingga semua event pointer berikutnya diarahkan ke canvas
    game.canvas.setPointerCapture(e.pointerId);
  });

  game.canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    const dx = currentX - startX;
    const dy = currentY - startY;

    // Jika pergerakan melebihi threshold, anggap sebagai drag
    if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      hasMoved = true;
    }

    if (hasMoved) {
      // Update posisi kamera berdasarkan pergeseran drag
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - game.canvas.width);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - game.canvas.height);
      startX = currentX;
      startY = currentY;
      // Mencegah perilaku default (misalnya, scrolling) saat dragging aktif
      e.preventDefault();
    }
  });

  game.canvas.addEventListener('pointerup', (e) => {
    // Jika tidak ada pergerakan yang signifikan, anggap sebagai tap/click
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        const origin = game.battle.pendingMove 
          ? game.battle.pendingMove.originalPosition 
          : { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row };
        const manhattanDistance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
        if (manhattanDistance > game.battle.selectedHero.movementRange) {
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }
        const occupyingUnit = getUnitAtCell(col, row);
        if (occupyingUnit && occupyingUnit !== game.battle.selectedHero) {
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }
        const path = game.battle.findPath(game.grid, origin, { col, row }, game.battle.selectedHero.movementRange);
        if (path.length === 0 || (path.length - 1) > game.battle.selectedHero.movementRange) {
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }
        if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.pendingMove = null;
          updateProfileStatus(null);
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
          updateProfileStatus(game.battle.selectedHero);
        }
      } else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          if (game.battle.selectedHero && game.battle.selectedHero === clickedHero) {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
            updateProfileStatus(null);
          } else {
            game.battle.selectedHero = clickedHero;
            game.battle.actionMode = 'selected';
            document.getElementById('actionMenu').style.display = 'block';
            updateProfileStatus(clickedHero);
          }
        } else {
          if (game.battle.actionMode === 'selected') {
            game.battle.selectedHero = null;
            game.battle.actionMode = 'normal';
            document.getElementById('actionMenu').style.display = 'none';
            updateProfileStatus(null);
          }
        }
      }
    }
    isDragging = false;
    hasMoved = false;
    game.canvas.releasePointerCapture(e.pointerId);
  });

  game.canvas.addEventListener('pointercancel', (e) => {
    isDragging = false;
    hasMoved = false;
    game.canvas.releasePointerCapture(e.pointerId);
  });

  // Optional: keyboard events (untuk debugging atau desktop)
  window.addEventListener('keydown', (e) => {
    const scrollSpeed = 20;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    }
  });
}
