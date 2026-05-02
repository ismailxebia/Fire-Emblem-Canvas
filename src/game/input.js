// js/input.js
import { Haptics, ImpactStyle } from './utils/haptics.js';

export function handleInput(game) {
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const dragThreshold = 15;

  // Track if we already processed this interaction (to prevent double-firing)
  let lastEventTime = 0;
  const EVENT_DEBOUNCE = 50; // ms

  // Unified handler for start
  const handleStart = (e) => {
    const now = Date.now();
    if (now - lastEventTime < EVENT_DEBOUNCE) return;
    lastEventTime = now;

    if (window.gameOverlayActive && game.turnPhase !== 'enemy') return;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    isDragging = true;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    startX = clientX;
    startY = clientY;
    hasMoved = false;

    if (e.pointerId !== undefined && game.canvas.setPointerCapture) {
      try {
        game.canvas.setPointerCapture(e.pointerId);
      } catch (err) { /* noop */ }
    }
  };

  const handleMove = (e) => {
    if (window.gameOverlayActive && game.turnPhase !== 'enemy') return;
    if (!isDragging) return;

    if (e.cancelable) e.preventDefault();

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
      const logicalWidth = game.canvas.clientWidth || game.canvas.width;
      const logicalHeight = game.canvas.clientHeight || game.canvas.height;
      game.camera.x = clamp(game.camera.x - dx, 0, game.grid.stageWidth - logicalWidth);
      game.camera.y = clamp(game.camera.y - dy, 0, game.grid.stageHeight - logicalHeight);
      startX = currentX;
      startY = currentY;
    }
  };

  const handleEnd = (e) => {
    const now = Date.now();
    if (now - lastEventTime < EVENT_DEBOUNCE) {
      isDragging = false;
      hasMoved = false;
      return;
    }
    lastEventTime = now;

    if (window.gameOverlayActive) {
      isDragging = false;
      hasMoved = false;
      return;
    }

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    if (e.pointerId !== undefined && game.canvas.releasePointerCapture) {
      try {
        game.canvas.releasePointerCapture(e.pointerId);
      } catch (err) { /* noop */ }
    }

    if (isDragging && hasMoved) {
      isDragging = false;
      hasMoved = false;
      return;
    }

    isDragging = false;
    hasMoved = false;

    let clientX, clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const rect = game.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.floor((x + game.camera.x - game.grid.padding) / game.grid.tileSize);
    const row = Math.floor((y + game.camera.y - game.grid.padding) / game.grid.tileSize);

    // Light haptic on tap that hits a unit
    const tapped = game.battle.getUnitAt(col, row);
    if (tapped) Haptics.impact(ImpactStyle.Light);

    if (game.actionSystem) {
      game.actionSystem.handleTileClick(col, row);
    }
  };

  const handleCancel = (e) => {
    isDragging = false;
    hasMoved = false;
    if (e.pointerId !== undefined && game.canvas.releasePointerCapture) {
      try {
        game.canvas.releasePointerCapture(e.pointerId);
      } catch (err) { /* noop */ }
    }
  };

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    game.canvas.addEventListener('touchstart', handleStart, { passive: false });
    game.canvas.addEventListener('touchmove', handleMove, { passive: false });
    game.canvas.addEventListener('touchend', handleEnd, { passive: false });
    game.canvas.addEventListener('touchcancel', handleCancel);
  } else {
    game.canvas.addEventListener('pointerdown', handleStart, { passive: false });
    game.canvas.addEventListener('pointermove', handleMove, { passive: false });
    game.canvas.addEventListener('pointerup', handleEnd, { passive: false });
    game.canvas.addEventListener('pointercancel', handleCancel);
  }

  const onKeyDown = (e) => {
    if (window.gameOverlayActive) return;
    const scrollSpeed = 20;
    const logicalHeight = game.canvas.clientHeight || game.canvas.height;
    if (e.key === 'ArrowDown') {
      game.camera.y = clamp(game.camera.y + scrollSpeed, 0, game.grid.stageHeight - logicalHeight);
    } else if (e.key === 'ArrowUp') {
      game.camera.y = clamp(game.camera.y - scrollSpeed, 0, game.grid.stageHeight - logicalHeight);
    } else if (e.key === 'Escape' && game.actionSystem?.cancelCurrent) {
      game.actionSystem.cancelCurrent();
    }
  };

  window.addEventListener('keydown', onKeyDown);

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
