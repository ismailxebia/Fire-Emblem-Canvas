// Anchor menu directly next to the selected character (FE-style):
//   - If character is in left half → menu to the RIGHT of the cell
//   - If character is in right half → menu to the LEFT of the cell
//   - Vertical: aligned to character's row, clamped to canvas bounds
//
// This keeps the menu close to where the player's thumb just tapped and
// preserves the visual link between unit and action.

const GAP = 12;
const VIEWPORT_MARGIN = 12;

export function positionMenuNearUnit(menuId, unit, game) {
  if (!menuId || !unit || !game) return;
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const canvas = game.canvas;
  const grid = game.grid;
  const camera = game.camera;
  if (!canvas || !grid) return;

  const canvasRect = canvas.getBoundingClientRect();

  // Use pendingMove destination over current col/row when applicable
  let col = unit.col;
  let row = unit.row;
  if (game.battle?.pendingMove?.newPosition && unit === game.battle.pendingMove.hero) {
    col = game.battle.pendingMove.newPosition.col;
    row = game.battle.pendingMove.newPosition.row;
  }

  const cellPos = grid.getCellPosition(col, row);
  const tileSize = grid.tileSize;
  const charCellX = canvasRect.left + cellPos.x - camera.x;
  const charCellY = canvasRect.top + cellPos.y - camera.y;
  const charCenterX = charCellX + tileSize / 2;

  const canvasMidX = canvasRect.left + canvasRect.width / 2;
  const charOnLeftHalf = charCenterX <= canvasMidX;

  // Use measured size if menu visible, otherwise estimate
  const measuredW = menu.offsetWidth;
  const measuredH = menu.offsetHeight;
  const menuW = measuredW > 0 ? measuredW : 184;
  const menuH = measuredH > 0 ? measuredH : 200;

  // Horizontal: place menu opposite side of the character cell
  let left;
  if (charOnLeftHalf) {
    left = charCellX + tileSize + GAP;
  } else {
    left = charCellX - menuW - GAP;
  }

  // Vertical: align menu top with character cell. If it would overflow the
  // bottom of canvas, anchor menu BOTTOM to the cell bottom instead so it
  // grows upward but still stays close to the unit.
  const canvasBottom = canvasRect.top + canvasRect.height;
  const canvasTop = canvasRect.top;
  let top = charCellY;
  if (top + menuH > canvasBottom - VIEWPORT_MARGIN) {
    top = charCellY + tileSize - menuH;
  }
  top = Math.max(canvasTop + VIEWPORT_MARGIN, Math.min(top, canvasBottom - menuH - VIEWPORT_MARGIN));

  // Horizontal viewport clamp (failsafe — flips menu inside the viewport
  // if the cell sits flush against an edge).
  const minLeft = VIEWPORT_MARGIN;
  const maxLeft = window.innerWidth - menuW - VIEWPORT_MARGIN;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  // Animation origin: corner of menu nearest to the character
  const originX = charOnLeftHalf ? 'left' : 'right';
  const charBelowMenu = (charCellY + tileSize / 2) > top + menuH / 2;
  const originY = charBelowMenu ? 'bottom' : 'top';
  menu.style.setProperty('--menu-origin', `${originY} ${originX}`);
}

// Position menu at bottom-center of the canvas. Use this when the player
// is selecting a target on the battlefield (move/attack/magic target
// selection) — the menu must stay out of the way so it doesn't cover
// nearby cells the player is choosing among.
export function positionMenuAtCanvasBottomCenter(menuId, game) {
  if (!menuId || !game) return;
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const canvas = game.canvas;
  if (!canvas) return;

  const canvasRect = canvas.getBoundingClientRect();
  const measuredW = menu.offsetWidth;
  const measuredH = menu.offsetHeight;
  const menuW = measuredW > 0 ? measuredW : 168;
  const menuH = measuredH > 0 ? measuredH : 44;

  const margin = 16;
  let left = canvasRect.left + (canvasRect.width - menuW) / 2;
  let top = canvasRect.top + canvasRect.height - menuH - margin - 8;

  left = Math.max(margin, Math.min(left, window.innerWidth - menuW - margin));
  top = Math.max(canvasRect.top + margin, Math.min(top, window.innerHeight - menuH - margin));

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.setProperty('--menu-origin', 'bottom center');
}

export function positionMenuAtCanvasBottomCenterDeferred(menuId, game) {
  const menu = document.getElementById(menuId);
  if (menu) {
    const prevTransition = menu.style.transition;
    menu.style.transition = 'none';
    positionMenuAtCanvasBottomCenter(menuId, game);
    void menu.offsetHeight;
    menu.style.transition = prevTransition;
  } else {
    positionMenuAtCanvasBottomCenter(menuId, game);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => positionMenuAtCanvasBottomCenter(menuId, game));
  });
}

// Refine after layout. Disables transition for the very first placement so
// the menu doesn't slide from its previous position on initial show.
export function positionMenuNearUnitDeferred(menuId, unit, game) {
  const menu = document.getElementById(menuId);
  if (menu) {
    const prevTransition = menu.style.transition;
    menu.style.transition = 'none';
    positionMenuNearUnit(menuId, unit, game);
    void menu.offsetHeight; // force reflow
    menu.style.transition = prevTransition;
  } else {
    positionMenuNearUnit(menuId, unit, game);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => positionMenuNearUnit(menuId, unit, game));
  });
}
