/**
 * A* Pathfinding implementation for the grid.
 * Uses Map-based open/closed sets for O(1) lookups instead of Array.find scans.
 */
const DIRS = [
  { dc: 0, dr: -1 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
  { dc: 1, dr: 0 },
];

const key = (col, row) => col * 10000 + row;

export class Pathfinder {
  static heuristic(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  static findPath(grid, start, goal, maxRange, obstacles = [], units = []) {
    const startK = key(start.col, start.row);
    const goalK = key(goal.col, goal.row);

    // Build occupancy set once per call (excludes start, includes goal so we can step on it
    // unless it's blocked — original behavior already filtered units anyway).
    const blocked = new Set();
    if (obstacles) {
      for (const o of obstacles) blocked.add(key(o.col, o.row));
    }
    if (units) {
      for (const u of units) {
        const k = key(u.col, u.row);
        if (k !== startK) blocked.add(k);
      }
    }

    const open = new Map(); // key -> node
    const closed = new Set();

    const startNode = {
      col: start.col,
      row: start.row,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.h;
    open.set(startK, startNode);

    while (open.size > 0) {
      // Find lowest-f node in open set
      let current = null;
      let currentK = null;
      for (const [k, n] of open) {
        if (current === null || n.f < current.f) {
          current = n;
          currentK = k;
        }
      }
      open.delete(currentK);
      closed.add(currentK);

      if (currentK === goalK) {
        const path = [];
        let temp = current;
        while (temp !== null) {
          path.push({ col: temp.col, row: temp.row });
          temp = temp.parent;
        }
        return path.reverse();
      }

      for (const d of DIRS) {
        const nc = current.col + d.dc;
        const nr = current.row + d.dr;
        if (nc < 0 || nc >= grid.cols || nr < 0 || nr >= grid.rows) continue;

        const nk = key(nc, nr);
        if (closed.has(nk)) continue;
        if (blocked.has(nk)) continue;

        // Range constraint from start
        const rangeFromStart = Math.abs(nc - start.col) + Math.abs(nr - start.row);
        if (rangeFromStart > maxRange) continue;

        const tentativeG = current.g + 1;
        if (tentativeG > maxRange) continue;

        const existing = open.get(nk);
        if (!existing) {
          const h = Math.abs(nc - goal.col) + Math.abs(nr - goal.row);
          open.set(nk, {
            col: nc,
            row: nr,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current,
          });
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = tentativeG + existing.h;
          existing.parent = current;
        }
      }
    }
    return [];
  }
}
