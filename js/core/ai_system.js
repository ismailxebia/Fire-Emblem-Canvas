
import { Pathfinder } from './pathfinder.js';

export class AISystem {
    constructor(battle, grid) {
        this.battle = battle;
        this.grid = grid;
    }

    getCandidateCells(enemy) {
        const candidates = [];
        const range = enemy.movementRange;

        // Simple BFS or range check to find all reachable cells
        for (let c = enemy.col - range; c <= enemy.col + range; c++) {
            for (let r = enemy.row - range; r <= enemy.row + range; r++) {
                if (Math.abs(c - enemy.col) + Math.abs(r - enemy.row) <= range) {
                    if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) continue;

                    // Check if occupied
                    const isOccupied = this.isCellOccupied(c, r) && (c !== enemy.col || r !== enemy.row);

                    if (!isOccupied) {
                        candidates.push({ col: c, row: r });
                    }
                }
            }
        }
        return candidates;
    }

    isCellOccupied(col, row) {
        if (this.grid.obstacles && this.grid.obstacles.some(o => o.col === col && o.row === row)) return true;
        if (this.battle.heroes.some(hero => hero.col === col && hero.row === row)) return true;
        if (this.battle.enemies.some(enemy => enemy.col === col && enemy.row === row)) return true;
        return false;
    }

    calculateMove(enemy) {
        let candidates = this.getCandidateCells(enemy);
        let dest = { col: enemy.col, row: enemy.row };
        let targetHero = null;
        let minDist = Infinity;

        // Find closest hero
        this.battle.heroes.forEach(hero => {
            if (hero.health <= 0) return;
            const dist = Math.abs(enemy.col - hero.col) + Math.abs(enemy.row - hero.row);
            if (dist < minDist) {
                minDist = dist;
                targetHero = hero;
            }
        });

        if (targetHero && candidates.length > 0) {
            let bestCandidate = null;
            let bestDistance = Infinity;

            candidates.forEach(cell => {
                const d = Math.abs(cell.col - targetHero.col) + Math.abs(cell.row - targetHero.row);
                if (d < bestDistance) {
                    bestDistance = d;
                    bestCandidate = cell;
                }
            });

            if (bestCandidate) dest = bestCandidate;
        }

        return dest;
    }
}
