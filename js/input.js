// js/input.js
import { updateProfileStatus } from './ui.js';

export function handleInput(game) {
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function getHeroAtCell(col, row) {
    for (const hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    return null;
  }

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
  const dragThreshold = 15;

  game.canvas.addEventListener('pointerdown', (e) => {
    if (window.gameOverlayActive) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
    game.canvas.setPointerCapture(e.pointerId);
  });

  game.canvas.addEventListener('pointermove', (e) => {
    if (window.gameOverlayActive) return;
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
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
      e.preventDefault();
    }
  });

  game.canvas.addEventListener('pointerup', (e) => {
    if (window.gameOverlayActive) return;
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
        // Tentukan titik asal (origin) berdasarkan pendingMove jika ada, atau posisi hero saat ini
        const origin = game.battle.pendingMove
          ? game.battle.pendingMove.originalPosition
          : { col: game.battle.selectedHero.col, row: game.battle.selectedHero.row };

        const manhattanDistance = Math.abs(col - origin.col) + Math.abs(row - origin.row);
        if (manhattanDistance > game.battle.selectedHero.movementRange) {
          e.preventDefault();
          e.stopPropagation();
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }

        const occupyingUnit = getUnitAtCell(col, row);
        if (occupyingUnit && occupyingUnit !== game.battle.selectedHero) {
          e.preventDefault();
          e.stopPropagation();
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }

        const path = game.battle.findPath(game.grid, origin, { col, row }, game.battle.selectedHero.movementRange);
        if (path.length === 0 || (path.length - 1) > game.battle.selectedHero.movementRange) {
          e.preventDefault();
          e.stopPropagation();
          game.canvas.releasePointerCapture(e.pointerId);
          isDragging = false;
          hasMoved = false;
          return;
        }

        // Pertama: cek apakah sudah ada pendingMove dan klik pada cell yang sama dengan pendingMove.newPosition
        if (game.battle.pendingMove && game.battle.pendingMove.newPosition &&
            game.battle.pendingMove.newPosition.col === col &&
            game.battle.pendingMove.newPosition.row === row) {
          game.battle.pendingMove.hero.actionTaken = true;
          game.battle.pendingMove = null;
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.actionMode = 'selected';
          updateProfileStatus(null);
        }
        // Jika klik pada cell yang sama dengan posisi hero (cancel move)
        else if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
          game.battle.actionMode = 'selected';
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.pendingMove = null;
          updateProfileStatus(null);
        }
        // Jika klik pada cell baru: update pendingMove
        else {
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
        // MODE NORMAL: Seleksi/deseleksi hero
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          // Jika hero sudah bertindak, tetap set sebagai selected (agar indicator muncul) tetapi tidak munculkan action menu
          if (clickedHero.actionTaken) {
            game.battle.selectedHero = clickedHero;
            game.battle.actionMode = 'selected';
            document.getElementById('actionMenu').style.display = 'none';
            updateProfileStatus(clickedHero);
            return;
          }
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

  window.addEventListener('keydown', (e) => {
    if (window.gameOverlayActive) return;
    const scrollSpeed = 20;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - game.canvas.height);
    }
  });
}
