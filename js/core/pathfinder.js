
/**
 * A* Pathfinding implementation for the grid.
 */
export class Pathfinder {
  static heuristic(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  static isValid(col, row, grid, obstacles, units, start, maxRange) {
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return false;

    // Check obstacles
    if (obstacles && obstacles.some(o => o.col === col && o.row === row)) return false;

    // Check units (enemies or other heroes depending on context)
    if (units && units.some(u => u.col === col && u.row === row)) return false;

    const rangeFromStart = Math.abs(col - start.col) + Math.abs(row - start.row);
    if (rangeFromStart > maxRange) return false;

    return true;
  }

  static getNeighbors(node, grid, obstacles, units, start, maxRange) {
    const neighbors = [];
    const directions = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ];

    directions.forEach(d => {
      const newCol = node.col + d.dc;
      const newRow = node.row + d.dr;
      if (this.isValid(newCol, newRow, grid, obstacles, units, start, maxRange)) {
        neighbors.push({ col: newCol, row: newRow });
      }
    });

    return neighbors;
  }

  static findPath(grid, start, goal, maxRange, obstacles = [], units = []) {
    const createNode = (col, row, g, h, parent) => ({ col, row, g, h, f: g + h, parent });

    const startNode = createNode(start.col, start.row, 0, this.heuristic(start, goal), null);
    const openSet = [startNode];
    const closedSet = [];

    while (openSet.length > 0) {
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet.splice(currentIndex, 1)[0];
      closedSet.push(current);

      if (current.col === goal.col && current.row === goal.row) {
        const path = [];
        let temp = current;
        while (temp !== null) {
          path.push({ col: temp.col, row: temp.row });
          temp = temp.parent;
        }
        return path.reverse();
      }

      const neighbors = this.getNeighbors(current, grid, obstacles, units, start, maxRange);
      for (const neighbor of neighbors) {
        if (closedSet.find(n => n.col === neighbor.col && n.row === neighbor.row)) continue;

        const tentativeG = current.g + 1;
        if (tentativeG > maxRange) continue;
        let neighborNode = openSet.find(n => n.col === neighbor.col && n.row === neighbor.row);

        if (!neighborNode) {
          neighborNode = createNode(
            neighbor.col,
            neighbor.row,
            tentativeG,
            this.heuristic(neighbor, goal),
            current
          );
          openSet.push(neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = tentativeG + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }
    return [];
  }
}
