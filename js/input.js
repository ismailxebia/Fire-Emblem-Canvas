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
    // Jika mode attack aktif, proses pemilihan target atau cancel.
    if (game.attackMode && game.battle.selectedHero) {
      const hero = game.battle.selectedHero;
      const tileSize = game.grid.tileSize;
      const attackRange = hero.attackRange;
      const heroPos = game.grid.getCellPosition(hero.col, hero.row);
      // Bounding box overlay attack range
      const minX = heroPos.x - attackRange * tileSize - game.camera.x;
      const minY = heroPos.y - attackRange * tileSize - game.camera.y;
      const maxX = heroPos.x + (attackRange + 1) * tileSize - game.camera.x;
      const maxY = heroPos.y + (attackRange + 1) * tileSize - game.camera.y;
      
      const rect = game.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Jika klik di luar area attack overlay, cancel attack mode.
      if (clickX < minX || clickX > maxX || clickY < minY || clickY > maxY) {
        game.attackMode = false;
        game.attackType = null;
        const confirmMenu = document.getElementById('confirmMenu');
        confirmMenu.style.display = 'none';
        updateProfileStatus(null);
        game.canvas.releasePointerCapture(e.pointerId);
        isDragging = false;
        hasMoved = false;
        return;
      }
      // Jika klik di dalam area, cek apakah mengenai enemy
      const col = Math.floor((clickX + game.camera.x) / tileSize);
      const row = Math.floor((clickY + game.camera.y) / tileSize);
      const enemy = getEnemyAtCell(col, row);
      if (enemy && Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row) <= hero.attackRange) {
        game.battle.heroAttack(hero, enemy);
        const actionMenu = document.getElementById('actionMenu');
        const confirmMenu = document.getElementById('confirmMenu');
        actionMenu.style.display = 'none';
        confirmMenu.style.display = 'none';
        game.attackMode = false;
        game.attackType = null;
        game.battle.selectedHero = null;
        game.battle.actionMode = 'normal';
        updateProfileStatus(null);
        game.canvas.releasePointerCapture(e.pointerId);
        isDragging = false;
        hasMoved = false;
        return;
      }
      // Klik di area kosong dalam overlay
      game.canvas.releasePointerCapture(e.pointerId);
      isDragging = false;
      hasMoved = false;
      return;
    }

    if (window.gameOverlayActive) return;
    // Pada fase enemy, lepas pointer capture tanpa proses seleksi.
    if (game.turnPhase === 'enemy') {
      game.canvas.releasePointerCapture(e.pointerId);
      isDragging = false;
      hasMoved = false;
      return;
    }
    // MODE ketika tidak terjadi dragging (tap/click)
    if (!hasMoved) {
      const rect = game.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor((x + game.camera.x) / game.grid.tileSize);
      const row = Math.floor((y + game.camera.y) / game.grid.tileSize);

      // MODE MOVE: jika hero sedang dalam mode move
      if (game.battle.actionMode === 'move' && game.battle.selectedHero) {
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

        // Jika klik pada cell yang sama dengan pendingMove.newPosition, konfirmasi move
        if (game.battle.pendingMove && game.battle.pendingMove.newPosition &&
            game.battle.pendingMove.newPosition.col === col &&
            game.battle.pendingMove.newPosition.row === row) {
          game.battle.pendingMove.hero.actionTaken = true;
          game.battle.pendingMove = null;
          document.getElementById('confirmMenu').style.display = 'none';
          game.battle.actionMode = 'selected';
          updateProfileStatus(null);
        }
        // Jika klik pada cell yang sama dengan posisi hero, cancel move
        else if (game.battle.selectedHero.col === col && game.battle.selectedHero.row === row) {
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
      }
      // MODE NORMAL: seleksi/deseleksi unit (hero atau enemy)
      else {
        const clickedHero = getHeroAtCell(col, row);
        if (clickedHero) {
          game.battle.enemies.forEach(enemy => enemy.selected = false);
          lastSelectedEnemy = null;
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
          const clickedEnemy = getEnemyAtCell(col, row);
          if (clickedEnemy) {
            game.battle.selectedHero = null;
            if (lastSelectedEnemy === clickedEnemy) {
              // Jika enemy yang sama sudah dipilih sebelumnya, tidak panggil update ulang
            } else {
              game.battle.enemies.forEach(enemy => enemy.selected = false);
              clickedEnemy.selected = true;
              lastSelectedEnemy = clickedEnemy;
            }
            game.battle.actionMode = 'enemySelected';
            document.getElementById('actionMenu').style.display = 'none';
            updateProfileStatus(clickedEnemy);
            return;
          } else {
            if (game.battle.actionMode === 'selected' || game.battle.actionMode === 'enemySelected') {
              game.battle.selectedHero = null;
              game.battle.actionMode = 'normal';
              document.getElementById('actionMenu').style.display = 'none';
              updateProfileStatus(null);
            }
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
