// Smart menu positioning — places menu in the canvas quadrant OPPOSITE to
// the selected character so it never covers them.
//
// Strategy:
//   1. Compute character center in viewport coordinates
//   2. Detect which canvas quadrant the character is in (TL/TR/BL/BR)
//   3. Anchor the menu in the opposite quadrant with safe margin
//   4. Set CSS variable --menu-origin so the scale-in animation
//      grows from the side closest to the character (visual continuity)

const HORIZONTAL_MARGIN = 16;
const VERTICAL_MARGIN = 16;

export function positionMenuNearUnit(menuId, unit, game) {
  if (!menuId || !unit || !game) return;
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const canvas = game.canvas;
  const grid = game.grid;
  const camera = game.camera;
  if (!canvas || !grid) return;

  const canvasRect = canvas.getBoundingClientRect();

  // Prefer pendingMove destination over current col/row when relevant
  let col = unit.col;
  let row = unit.row;
  if (game.battle?.pendingMove?.newPosition && unit === game.battle.pendingMove.hero) {
    col = game.battle.pendingMove.newPosition.col;
    row = game.battle.pendingMove.newPosition.row;
  }

  const cellPos = grid.getCellPosition(col, row);
  const charScreenX = canvasRect.left + cellPos.x + grid.tileSize / 2 - camera.x;
  const charScreenY = canvasRect.top + cellPos.y + grid.tileSize / 2 - camera.y;

  const canvasMidX = canvasRect.left + canvasRect.width / 2;
  const canvasMidY = canvasRect.top + canvasRect.height / 2;

  const charOnLeftHalf = charScreenX <= canvasMidX;
  const charOnTopHalf = charScreenY <= canvasMidY;

  // Use measured size if menu is currently visible; otherwise estimate
  const measuredW = menu.offsetWidth;
  const measuredH = menu.offsetHeight;
  const menuW = measuredW > 0 ? measuredW : 184;
  const menuH = measuredH > 0 ? measuredH : 200;

  let left, top;

  // Horizontal: opposite half of canvas
  if (charOnLeftHalf) {
    // Char on left → menu on right
    left = canvasRect.left + canvasRect.width - menuW - HORIZONTAL_MARGIN;
  } else {
    // Char on right → menu on left
    left = canvasRect.left + HORIZONTAL_MARGIN;
  }

  // Vertical: opposite half within canvas
  if (charOnTopHalf) {
    // Char in top half → menu near bottom of canvas
    top = canvasRect.top + canvasRect.height - menuH - VERTICAL_MARGIN;
  } else {
    // Char in bottom half → menu near top of canvas
    top = canvasRect.top + VERTICAL_MARGIN;
  }

  // Clamp to viewport (defense-in-depth)
  left = Math.max(HORIZONTAL_MARGIN, Math.min(left, window.innerWidth - menuW - HORIZONTAL_MARGIN));
  top = Math.max(canvasRect.top + VERTICAL_MARGIN, Math.min(top, window.innerHeight - menuH - VERTICAL_MARGIN));

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  // Animation origin: closest corner of menu to the character
  // (so it scales toward / from the character)
  const originX = charOnLeftHalf ? 'left' : 'right';
  const originY = charOnTopHalf ? 'top' : 'bottom';
  menu.style.setProperty('--menu-origin', `${originY} ${originX}`);
}

// Refine position after layout. Call right after setting display:flex.
// Disables CSS transition for the very first placement (avoids slide from
// previous position) then re-enables it for subsequent updates.
export function positionMenuNearUnitDeferred(menuId, unit, game) {
  const menu = document.getElementById(menuId);
  if (menu) {
    const prevTransition = menu.style.transition;
    menu.style.transition = 'none';
    positionMenuNearUnit(menuId, unit, game);
    // Force reflow so the position-without-transition takes effect
    // before re-enabling transition for any later refinement.
    void menu.offsetHeight;
    menu.style.transition = prevTransition;
  } else {
    positionMenuNearUnit(menuId, unit, game);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => positionMenuNearUnit(menuId, unit, game));
  });
}
