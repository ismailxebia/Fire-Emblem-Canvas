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
  let lastSelectedEnemy = null;

  // Track if we already processed this interaction (to prevent double-firing)
  let lastEventTime = 0;
  const EVENT_DEBOUNCE = 50; // ms

  // Unified handler for start
  const handleStart = (e) => {
    // Debounce to prevent double-firing from pointer + touch
    const now = Date.now();
    if (now - lastEventTime < EVENT_DEBOUNCE) {
      console.log('[INPUT] Debounced duplicate event');
      return;
    }
    lastEventTime = now;

    console.log('[INPUT] handleStart fired:', e.type);

    if (window.gameOverlayActive && game.turnPhase !== 'enemy') {
      console.log('[INPUT] Blocked by overlay');
      return;
    }

    // Prevent default to avoid issues in WebView
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();

    isDragging = true;

    // Get coordinates from either pointer or touch event
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    console.log('[INPUT] Start Coordinates:', clientX, clientY);

    startX = clientX;
    startY = clientY;
    hasMoved = false;

    if (e.pointerId !== undefined && game.canvas.setPointerCapture) {
      try {
        game.canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[INPUT] setPointerCapture failed:', err);
      }
    }
  };

  // Unified handler for move
  const handleMove = (e) => {
    if (window.gameOverlayActive && game.turnPhase !== 'enemy') return;
    if (!isDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    let currentX, currentY;
    if (e.touches && e.touches.length > 0) {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }

    const dx = currentX - startX;
    const dy = currentY - startY;
    if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      hasMoved = true;
    }
    if (hasMoved) {
      // Use logical (CSS) canvas dimensions, not internal DPR-scaled dimensions
      const logicalWidth = game.canvas.clientWidth || game.canvas.width;
      const logicalHeight = game.canvas.clientHeight || game.canvas.height;
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - logicalWidth);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - logicalHeight);
      startX = currentX;
      startY = currentY;
    }
  };

  // Unified handler for end
  const handleEnd = (e) => {
    console.log('[INPUT] handleEnd fired:', e.type);

    // Debounce
    const now = Date.now();
    if (now - lastEventTime < EVENT_DEBOUNCE) {
      console.log('[INPUT] Debounced duplicate end event');
      isDragging = false;
      hasMoved = false;
      return;
    }
    lastEventTime = now;

    if (window.gameOverlayActive) {
      console.log('[INPUT] End blocked by overlay');
      isDragging = false;
      hasMoved = false;
      return;
    }

    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();

    // Release capture for pointer events
    if (e.pointerId !== undefined && game.canvas.releasePointerCapture) {
      try {
        game.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[INPUT] releasePointerCapture failed:', err);
      }
    }

    if (isDragging && hasMoved) {
      console.log('[INPUT] Was dragging, not a tap');
      isDragging = false;
      hasMoved = false;
      return;
    }

    isDragging = false;
    hasMoved = false;

    // Get coordinates - for touchend, use changedTouches
    let clientX, clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      console.log('[INPUT] No valid coordinates for end');
      return;
    }

    console.log('[INPUT] End Coordinates:', clientX, clientY);

    const rect = game.canvas.getBoundingClientRect();
    // Use CSS coordinates directly (no scaling needed)
    // Grid tileSize is calculated from logical/CSS width, not internal canvas size
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Calculate grid position using logical coordinates
    // Note: grid.padding accounts for the safe area
    const col = Math.floor((x + game.camera.x - game.grid.padding) / game.grid.tileSize);
    const row = Math.floor((y + game.camera.y - game.grid.padding) / game.grid.tileSize);

    console.log('[INPUT] Grid position:', col, row, 'from x:', x, 'y:', y);

    // Delegate to ActionSystem
    if (game.actionSystem) {
      console.log('[INPUT] Calling handleTileClick');
      game.actionSystem.handleTileClick(col, row);
    } else {
      console.log('[INPUT] No actionSystem!');
    }
  };

  const handleCancel = (e) => {
    console.log('[INPUT] handleCancel fired:', e.type);
    isDragging = false;
    hasMoved = false;
    if (e.pointerId !== undefined && game.canvas.releasePointerCapture) {
      try {
        game.canvas.releasePointerCapture(e.pointerId);
      } catch (err) { }
    }
  };

  // Only use touch events on touch devices, pointer events otherwise
  // This prevents double-firing
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    console.log('[INPUT] Using touch events');
    game.canvas.addEventListener('touchstart', handleStart, { passive: false });
    game.canvas.addEventListener('touchmove', handleMove, { passive: false });
    game.canvas.addEventListener('touchend', handleEnd, { passive: false });
    game.canvas.addEventListener('touchcancel', handleCancel);
  } else {
    console.log('[INPUT] Using pointer events');
    game.canvas.addEventListener('pointerdown', handleStart, { passive: false });
    game.canvas.addEventListener('pointermove', handleMove, { passive: false });
    game.canvas.addEventListener('pointerup', handleEnd, { passive: false });
    game.canvas.addEventListener('pointercancel', handleCancel);
  }

  const onKeyDown = (e) => {
    if (window.gameOverlayActive) return;
    const scrollSpeed = 20;
    // Use logical (CSS) canvas dimensions for camera bounds
    const logicalHeight = game.canvas.clientHeight || game.canvas.height;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - logicalHeight);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - logicalHeight);
    }
  };

  window.addEventListener('keydown', onKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    if (isTouchDevice) {
      game.canvas.removeEventListener('touchstart', handleStart);
      game.canvas.removeEventListener('touchmove', handleMove);
      game.canvas.removeEventListener('touchend', handleEnd);
      game.canvas.removeEventListener('touchcancel', handleCancel);
    } else {
      game.canvas.removeEventListener('pointerdown', handleStart);
      game.canvas.removeEventListener('pointermove', handleMove);
      game.canvas.removeEventListener('pointerup', handleEnd);
      game.canvas.removeEventListener('pointercancel', handleCancel);
    }
  };
}
