
import { updateProfileStatus } from '../ui.js';

export const ActionState = {
    IDLE: 'IDLE',
    HERO_SELECTED: 'HERO_SELECTED',
    MOVING: 'MOVING',
    CONFIRM_MOVE: 'CONFIRM_MOVE',
    SELECT_ATTACK_TARGET: 'SELECT_ATTACK_TARGET',
    SELECT_MAGIC_TARGET: 'SELECT_MAGIC_TARGET',
    ENEMY_TURN: 'ENEMY_TURN'
};

export class ActionSystem {
    constructor(game) {
        this.game = game;
        this.state = ActionState.IDLE;
        this.selectedHero = null;
        this.pendingMove = null; // { hero, from: {col, row}, to: {col, row} }
    }

    reset() {
        this.state = ActionState.IDLE;
        this.selectedHero = null;
        this.pendingMove = null;
        this.game.battle.selectedHero = null;
        this.game.battle.actionMode = 'normal';
        this.game.attackMode = false;
        this.game.attackType = null;

        this.updateUI();
    }

    // Called when a tile is clicked
    handleTileClick(col, row) {
        console.log('[ACTION] handleTileClick:', col, row, 'turnPhase:', this.game.turnPhase, 'state:', this.state);
        if (this.game.turnPhase === 'enemy') return;

        const unit = this.getUnitAt(col, row);
        console.log('[ACTION] Unit at position:', unit ? unit.name : 'none');
        // Check using isHero/isEnemy flags or property existence instead of constructor name which gets mangled
        const hero = unit && unit.attackRange !== undefined && unit.moveSpeed !== undefined ? unit : null; // Loose check or better add a type property
        const enemy = unit && unit.aiType !== undefined ? unit : null; // Enemy has aiType

        // Robust check: Add isHero/isEnemy properties to classes later, for now let's use what we know distinguishes them
        // Hero has 'movementRange' property, Enemy has 'aiType' logic usually. 
        // Actually, let's just use a safer check.

        // Better fix: Check if it's in the heroes list vs enemies list logic which is already handled by getUnitAt
        // But getUnitAt just returns the object.

        // Let's rely on the fact that heroes are in game.battle.heroes
        const isHero = unit && this.game.battle.heroes.includes(unit);
        const isEnemy = unit && this.game.battle.enemies.includes(unit);

        const finalHero = isHero ? unit : null;
        const finalEnemy = isEnemy ? unit : null;

        switch (this.state) {
            case ActionState.IDLE:
                if (finalHero && !finalHero.actionTaken) {
                    this.selectHero(finalHero);
                } else if (finalHero) {
                    // Hero already acted, just show info?
                    this.selectHero(finalHero, true);
                } else if (finalEnemy) {
                    // Show enemy range/info
                    this.selectEnemy(finalEnemy);
                }
                break;

            case ActionState.HERO_SELECTED:
                if (finalHero === this.selectedHero) {
                    // Clicked self again, deselect
                    this.reset();
                } else if (finalHero && !finalHero.actionTaken) {
                    // Switch selection
                    this.selectHero(finalHero);
                } else {
                    // Clicked empty space or enemy, deselect
                    this.reset();
                }
                break;

            case ActionState.MOVING:
            case ActionState.CONFIRM_MOVE: // Allow re-selecting tile
                this.handleMoveSelection(col, row);
                break;

            case ActionState.SELECT_ATTACK_TARGET:
            case ActionState.SELECT_MAGIC_TARGET:
                this.handleAttackTargetSelection(col, row);
                break;

            default:
                break;
        }
    }

    selectHero(hero, readonly = false) {
        console.log('[ACTION] selectHero called:', hero.name, 'readonly:', readonly);
        this.selectedHero = hero;
        this.game.battle.selectedHero = hero;
        updateProfileStatus(hero);

        if (readonly) {
            this.state = ActionState.IDLE; // Or a specific READONLY state
            this.game.battle.actionMode = 'normal';
            this.hideAllMenus();
        } else {
            this.state = ActionState.HERO_SELECTED;
            this.game.battle.actionMode = 'selected';
            console.log('[ACTION] About to show action menu');
            this.showActionMenu();
        }
    }

    selectEnemy(enemy) {
        // Just show info for now
        updateProfileStatus(enemy);
        this.game.battle.enemies.forEach(e => e.selected = false);
        enemy.selected = true;
        this.game.battle.actionMode = 'enemySelected';
    }

    activateMoveMode() {
        if (!this.selectedHero) return;
        this.state = ActionState.MOVING;
        this.game.battle.actionMode = 'move';
        this.game.battle.pendingMove = {
            hero: this.selectedHero,
            originalPosition: { col: this.selectedHero.col, row: this.selectedHero.row },
            newPosition: null
        };

        // Show Cancel button immediately so user can cancel move selection
        this.showCancelOnlyMenu();
    }

    showCancelOnlyMenu() {
        const menu = document.getElementById('confirmMenu');
        if (menu) {
            menu.style.display = 'flex'; // Use flex as per CSS
            // Hide others
            const btnAttack = document.getElementById('btnAttackConfirm');
            if (btnAttack) btnAttack.style.display = 'none';
            const btnMagic = document.getElementById('btnMagicConfirm');
            if (btnMagic) btnMagic.style.display = 'none';
            const btnConfirm = document.getElementById('btnConfirm');
            if (btnConfirm) btnConfirm.style.display = 'none';

            // Show Cancel
            const btnCancel = document.getElementById('btnCancel');
            if (btnCancel) btnCancel.style.display = 'block';
        }
        this.hideActionMenu();
    }

    handleMoveSelection(col, row) {
        const hero = this.selectedHero;
        const origin = this.game.battle.pendingMove.originalPosition;

        // Calculate distance
        const dist = Math.abs(col - origin.col) + Math.abs(row - origin.row);

        // Validate range
        if (dist > hero.movementRange) {
            return;
        }

        // Validate occupancy (unless it's self)
        const occupant = this.getUnitAt(col, row);
        if (occupant && occupant !== hero) {
            return; // Cannot move to occupied tile
        }

        // Special case: Clicking self (Stay)
        if (col === origin.col && row === origin.row) {
            this.game.battle.pendingMove.newPosition = { col, row };
            // Ensure hero visually moves back to start if they were elsewhere
            hero.startMove(this.game.grid, col, row);

            this.state = ActionState.CONFIRM_MOVE;
            this.showConfirmMenu();
            return;
        }

        // Validate path (using Pathfinder)
        const path = this.game.battle.findPath(this.game.grid, origin, { col, row }, hero.movementRange);
        if (path.length === 0 || (path.length - 1) > hero.movementRange) {
            return; // No valid path or path too long
        }

        // Valid move!

        // If we are already in CONFIRM_MOVE and re-selecting, we might need to reset position first?
        // Actually startMove handles interpolation from current pixelX/Y, so it should be fine.

        this.game.battle.pendingMove.newPosition = { col, row };

        // Move the hero visually to the new spot immediately for "Confirm" phase
        hero.startMove(this.game.grid, col, row);

        this.state = ActionState.CONFIRM_MOVE;
        this.showConfirmMenu();
    }

    activateAttackMode(type = 'physical') {
        this.state = type === 'magic' ? ActionState.SELECT_MAGIC_TARGET : ActionState.SELECT_ATTACK_TARGET;
        this.game.attackMode = true;
        this.game.attackType = type;
        this.game.battle.actionMode = 'selected'; // To show range overlay
        this.hideAllMenus();

        // Show cancel button only (or back)
        const confirmMenu = document.getElementById('confirmMenu');
        if (confirmMenu) {
            confirmMenu.style.display = 'block';
            document.getElementById('btnAttackConfirm').style.display = 'none';
            document.getElementById('btnConfirm').style.display = 'none';
            document.getElementById('btnCancel').style.display = 'inline-block';
        }
    }

    handleAttackTargetSelection(col, row) {
        const enemy = this.getUnitAt(col, row);
        // Robust check for enemy
        const isEnemy = enemy && this.game.battle.enemies.includes(enemy);

        if (isEnemy) {
            // Check range
            const hero = this.selectedHero;
            const dist = Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row);
            if (dist <= hero.attackRange) {
                this.executeAttack(enemy);
            }
        }
    }

    calculateDamage(attacker, defender) {
        // Simple damage logic: Physical vs Magic
        // If it's the hero attacking, check game.attackType
        // If it's enemy counter, assume physical for now (or add enemy magic property later)
        if (attacker === this.selectedHero && this.game.attackType === 'magic') {
            return Math.max(0, attacker.attack - defender.res);
        }
        return Math.max(0, attacker.attack - defender.def);
    }

    executeAttack(target) {
        const hero = this.selectedHero;
        const damage = this.calculateDamage(hero, target);

        // Calculate Counter Damage
        let counterDamage = null;
        const dist = Math.abs(hero.col - target.col) + Math.abs(hero.row - target.row);
        // Enemy can counter if in range
        const range = target.attackRange || 1;
        if (dist <= range) {
            // Enemy counter is assumed physical for now
            counterDamage = Math.max(0, target.attack - hero.def);
        }

        // Trigger Battle Scene
        this.hideAllMenus();
        this.game.battleScene.start(hero, target, damage, counterDamage, () => {
            // Apply damage after animation
            target.health = Math.max(0, target.health - damage);
            console.log(`${hero.name} attacks ${target.name} for ${damage} damage!`);

            // Apply counter damage if enemy survived
            if (counterDamage !== null && target.health > 0) {
                hero.health = Math.max(0, hero.health - counterDamage);
                console.log(`${target.name} counters ${hero.name} for ${counterDamage} damage!`);
            }

            // Update HUD
            updateProfileStatus(hero);
            updateProfileStatus(target);

            // Remove dead units from battlefield
            if (target.health <= 0) {
                console.log(`${target.name} has been defeated!`);
                // Remove from enemies array
                const index = this.game.battle.enemies.indexOf(target);
                if (index > -1) {
                    this.game.battle.enemies.splice(index, 1);
                }
            }

            if (hero.health <= 0) {
                console.log(`${hero.name} has been defeated!`);
                // Remove from heroes array
                const index = this.game.battle.heroes.indexOf(hero);
                if (index > -1) {
                    this.game.battle.heroes.splice(index, 1);
                }
            }

            // Mark action taken
            this.finalizeAction();
        });
    }

    executeEnemyAttack(attacker, defender, onComplete) {
        // 1. Calculate Damage (Enemy -> Hero)
        // Assume physical for now
        const damage = Math.max(0, attacker.attack - defender.def);

        // 2. Calculate Counter Damage (Hero -> Enemy)
        let counterDamage = null;
        const dist = Math.abs(attacker.col - defender.col) + Math.abs(attacker.row - defender.row);

        // Hero can counter if in range
        // Hero usually has range 1 unless bow/magic. Let's check hero's attackRange
        const range = defender.attackRange || 1;
        if (dist <= range) {
            // Hero counter
            // Check if hero uses magic or physical? For now assume physical unless we check class/weapon
            counterDamage = Math.max(0, defender.attack - attacker.def);
        }

        // 3. Trigger Battle Scene
        // Note: attacker is Enemy (Right side usually in my code? No, I set logic: Attacker Left, Defender Right)
        // In BattleScene.start: 
        // "const isHeroAttacker = attacker.constructor.name === 'Hero';"
        // If attacker is Enemy, isHeroAttacker is false.
        // leftUnit = defender (Hero), rightUnit = attacker (Enemy).
        // So Hero is Left, Enemy is Right.
        // Turn 1: Attacker (Enemy/Right) -> Receiver (Hero/Left).
        // Turn 2: Defender (Hero/Left) -> Receiver (Enemy/Right).
        // This logic in BattleScene seems robust enough.

        this.hideAllMenus(); // Just in case
        this.game.battleScene.start(attacker, defender, damage, counterDamage, () => {
            // Apply damage
            defender.health = Math.max(0, defender.health - damage);
            console.log(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);

            if (counterDamage !== null && defender.health > 0) {
                attacker.health = Math.max(0, attacker.health - counterDamage);
                console.log(`${defender.name} counters ${attacker.name} for ${counterDamage} damage!`);
            }

            // Update HUD
            updateProfileStatus(attacker);
            updateProfileStatus(defender);

            // Remove dead units from battlefield
            if (defender.health <= 0) {
                console.log(`${defender.name} has been defeated!`);
                // Remove from heroes array (defender is usually hero in enemy attack)
                const index = this.game.battle.heroes.indexOf(defender);
                if (index > -1) {
                    this.game.battle.heroes.splice(index, 1);
                }
            }

            if (attacker.health <= 0) {
                console.log(`${attacker.name} has been defeated!`);
                // Remove from enemies array (attacker is enemy in enemy attack)
                const index = this.game.battle.enemies.indexOf(attacker);
                if (index > -1) {
                    this.game.battle.enemies.splice(index, 1);
                }
            }

            if (onComplete) onComplete();
        });
    }

    wait() {
        this.finalizeAction();
    }

    finalizeAction() {
        if (this.selectedHero) {
            this.selectedHero.actionTaken = true;
        }
        this.reset();
    }

    cancelAction() {
        // Revert move if pending
        if (this.game.battle.pendingMove) {
            const { hero, originalPosition } = this.game.battle.pendingMove;
            hero.col = originalPosition.col;
            hero.row = originalPosition.row;
            // Reset visual position
            const pos = this.game.grid.getCellPosition(hero.col, hero.row);
            hero.pixelX = pos.x;
            hero.pixelY = pos.y;

            this.game.battle.pendingMove = null;
        }

        // Go back to Hero Selected state
        if (this.selectedHero) {
            this.state = ActionState.HERO_SELECTED;
            this.game.battle.actionMode = 'selected';
            this.showActionMenu();
        } else {
            this.reset();
        }
    }

    // Helpers
    getUnitAt(col, row) {
        return this.game.battle.heroes.find(h => h.col === col && h.row === row) ||
            this.game.battle.enemies.find(e => e.col === col && e.row === row);
    }

    showActionMenu() {
        console.log('[ACTION] showActionMenu called');
        const menu = document.getElementById('actionMenu');
        console.log('[ACTION] actionMenu element:', menu);
        if (menu) {
            menu.style.display = 'flex';
            console.log('[ACTION] Set display to flex');
        }
        this.hideConfirmMenu();

        // Update buttons based on context (e.g. can attack?)
        this.updateActionButtons();
    }

    updateActionButtons() {
        const hero = this.selectedHero;
        if (!hero) return;

        const btnAttack = document.getElementById('btnAttack');
        const btnMagic = document.getElementById('btnMagic');

        // Check if any enemy is in range
        let canAttack = false;
        for (const enemy of this.game.battle.enemies) {
            if (enemy.health <= 0) continue;
            const dist = Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row);
            if (dist <= hero.attackRange) {
                canAttack = true;
                break;
            }
        }

        if (btnAttack) btnAttack.style.display = canAttack ? 'block' : 'none';
        if (btnMagic) btnMagic.style.display = canAttack ? 'block' : 'none'; // Assuming magic has same range for now
    }

    showConfirmMenu() {
        const menu = document.getElementById('confirmMenu');
        if (menu) {
            menu.style.display = 'block';
            // Show Wait and Cancel
            document.getElementById('btnConfirm').style.display = 'inline-block'; // Re-purposed as Wait
            document.getElementById('btnConfirm').textContent = 'Wait';
            document.getElementById('btnCancel').style.display = 'inline-block';

            // Check if can attack from new position
            let canAttack = false;
            const hero = this.selectedHero;
            // Use pending new position if available, otherwise current position
            const currentPos = this.game.battle.pendingMove ? this.game.battle.pendingMove.newPosition : { col: hero.col, row: hero.row };

            for (const enemy of this.game.battle.enemies) {
                if (enemy.health <= 0) continue;
                const dist = Math.abs(currentPos.col - enemy.col) + Math.abs(currentPos.row - enemy.row);
                if (dist <= hero.attackRange) {
                    canAttack = true;
                    break;
                }
            }

            const btnAttackConfirm = document.getElementById('btnAttackConfirm');
            if (btnAttackConfirm) {
                btnAttackConfirm.style.display = canAttack ? 'inline-block' : 'none';
            }

            const btnMagicConfirm = document.getElementById('btnMagicConfirm');
            if (btnMagicConfirm) {
                btnMagicConfirm.style.display = canAttack ? 'inline-block' : 'none';
            }
        }
        this.hideActionMenu();
    }

    hideActionMenu() {
        const menu = document.getElementById('actionMenu');
        if (menu) menu.style.display = 'none';
    }

    hideConfirmMenu() {
        const menu = document.getElementById('confirmMenu');
        if (menu) menu.style.display = 'none';
    }

    hideAllMenus() {
        this.hideActionMenu();
        this.hideConfirmMenu();
    }

    updateUI() {
        if (this.state === ActionState.IDLE) {
            this.hideAllMenus();
        }
    }
}
