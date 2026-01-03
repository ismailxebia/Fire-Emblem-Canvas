// js/input.js
import { updateProfileStatus } from './ui.js';

export function handleInput(game) {
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Helper: cari hero di suatu cell
  function getHeroAtCell(col, row) {
    for (const hero of game.battle.heroes) {
      if (hero.col === col && hero.row === row) return hero;
    }
    return null;
  }

  // Helper: cari enemy di suatu cell
  function getEnemyAtCell(col, row) {
    for (const enemy of game.battle.enemies) {
      if (enemy.col === col && enemy.row === row) return enemy;
    }
    return null;
  }

  // Helper: cari unit (hero atau enemy) di suatu cell
  function getUnitAtCell(col, row) {
    const hero = getHeroAtCell(col, row);
    if (hero) return hero;
    const enemy = getEnemyAtCell(col, row);
    if (enemy) return enemy;
    return null;
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const dragThreshold = 15;
  let lastSelectedEnemy = null; // Guard untuk mencegah update berulang enemy

  // Pointer down
  game.canvas.addEventListener('pointerdown', (e) => {
    if (window.gameOverlayActive && game.turnPhase !== 'enemy') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
    game.canvas.setPointerCapture(e.pointerId);
  });

  // Pointer move (untuk dragging/scrolling)
  game.canvas.addEventListener('pointermove', (e) => {
    if (window.gameOverlayActive && game.turnPhase !== 'enemy') return;
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

  // Pointer up
  game.canvas.addEventListener('pointerup', (e) => {
    if (window.gameOverlayActive) return;

    // Release capture
    game.canvas.releasePointerCapture(e.pointerId);

    if (isDragging && hasMoved) {
      isDragging = false;
      hasMoved = false;
      return;
    }

    isDragging = false;
    hasMoved = false;

    const rect = game.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
    const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

    // Delegate to ActionSystem
    if (game.actionSystem) {
      game.actionSystem.handleTileClick(col, row);
    }
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
