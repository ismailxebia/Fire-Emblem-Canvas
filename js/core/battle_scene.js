
export class BattleScene {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.phase = 'inactive'; // inactive, intro, attack, hit, outro
        this.timer = 0;

        this.attacker = null;
        this.defender = null;
        this.damage = 0;
        this.onComplete = null;

        // Visual properties
        this.bgColor = '#2a2a2a'; // Fallback
        this.uiHeight = 80;

        // Animation states
        this.attackerPos = { x: 0, y: 0 };
        this.defenderPos = { x: 0, y: 0 };
        this.attackerSpriteState = { frame: 0, row: 0 };
        this.defenderSpriteState = { frame: 0, row: 0 };

        // Shake effect
        this.shake = { x: 0, y: 0, intensity: 0 };
    }

    start(attacker, defender, damage, counterDamage, callback) {
        this.active = true;
        this.attacker = attacker;
        this.defender = defender;
        this.damage = damage;
        this.onComplete = callback;

        // Build turn queue
        this.turns = [];

        // Turn 1: Attacker -> Defender
        this.turns.push({
            attacker: attacker,
            receiver: defender,
            damage: damage
        });

        // Turn 2: Defender -> Attacker (Counter)
        // Only if counterDamage is valid (not null)
        // Note: Logic check for "is defender alive" happens visually here? 
        // We can simulate it: if damage >= defender.health, maybe skip counter?
        // But for dramatic effect, let's assume we show the counter attempt unless dead.
        // Actually, let's just push it. If defender dies in first turn, we can handle it in update loop.
        if (counterDamage !== null && counterDamage !== undefined) {
            this.turns.push({
                attacker: defender,
                receiver: attacker,
                damage: counterDamage
            });
        }

        this.currentTurnIndex = 0;
        this.phase = 'intro';
        this.timer = 0;
        this.transitionProgress = 0;

        // Visual HP (clones to animate)
        this.leftHP = this.attacker.health;
        this.rightHP = this.defender.health;

        // Map units to Left/Right for rendering
        const isHeroAttacker = attacker.constructor.name === 'Hero';
        this.leftUnit = isHeroAttacker ? attacker : defender;
        this.rightUnit = isHeroAttacker ? defender : attacker;

        // Visual HP (clones to animate) - MUST use leftUnit/rightUnit!
        this.leftHP = this.leftUnit.health;
        this.rightHP = this.rightUnit.health;

        this.updateLayout();
    }

    updateLayout() {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        // Center vertically (Feet position)
        // Move down to 75% height so the whole body fits better
        const centerY = h * 0.75;

        // Move units slightly closer to center
        this.leftPos = { x: w * 0.25, y: centerY };
        this.rightPos = { x: w * 0.75, y: centerY };

        // Reduced scale further
        // Base scale 1.1 on 400px width
        this.scale = Math.max(1.0, Math.min(2.0, (w / 400) * 1.1));
    }

    update(deltaTime) {
        if (!this.active) return;
        this.timer += deltaTime;
        this.updateLayout();

        // Shake decay
        if (this.shake.intensity > 0) {
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.intensity *= 0.9;
            if (this.shake.intensity < 0.5) this.shake.intensity = 0;
        } else {
            this.shake.x = 0;
            this.shake.y = 0;
        }

        switch (this.phase) {
            case 'intro':
                this.transitionProgress = Math.min(this.transitionProgress + deltaTime / 500, 1);
                if (this.timer > 800) {
                    this.startTurn();
                }
                break;

            case 'attack_charge':
                // Wait a bit before attack animation
                if (this.timer > 200) {
                    this.phase = 'attack_anim';
                    this.timer = 0;
                    const turn = this.turns[this.currentTurnIndex];
                    turn.attacker.currentAction = 'attack';
                    turn.attacker.frameIndex = 0;
                }
                break;

            case 'attack_anim':
                // Wait for hit frame (approx 400ms)
                if (this.timer > 400) {
                    this.phase = 'hit';
                    this.timer = 0;
                    this.shake.intensity = 20;

                    // Apply visual damage
                    const turn = this.turns[this.currentTurnIndex];
                    if (turn.receiver === this.leftUnit) {
                        this.leftHP = Math.max(0, this.leftHP - turn.damage);
                    } else {
                        this.rightHP = Math.max(0, this.rightHP - turn.damage);
                    }
                }
                break;

            case 'hit':
                // Show damage for 800ms
                if (this.timer > 800) {
                    const turn = this.turns[this.currentTurnIndex];
                    turn.attacker.currentAction = 'idle';

                    // Check if receiver died
                    const receiverDead = (turn.receiver === this.leftUnit && this.leftHP <= 0) ||
                        (turn.receiver === this.rightUnit && this.rightHP <= 0);

                    if (receiverDead) {
                        console.log(`Battle: Receiver ${turn.receiver.name} died. Starting death animation.`);
                        this.phase = 'death';
                        this.timer = 0;
                        this.dyingUnit = turn.receiver;
                        this.deathProgress = 0; // 0 to 1
                    } else {
                        console.log(`Battle: Turn ${this.currentTurnIndex + 1} completed. Moving to next turn or outro.`);
                        this.currentTurnIndex++;
                        if (this.currentTurnIndex < this.turns.length) {
                            console.log(`Battle: Starting turn ${this.currentTurnIndex + 1}.`);
                            this.startTurn();
                        } else {
                            this.phase = 'outro';
                            this.timer = 0;
                        }
                    }
                }
                break;

            case 'death':
                // Death animation: white flash + fade out
                this.deathProgress = Math.min(this.deathProgress + deltaTime / 800, 1);
                if (this.timer > 1200) {
                    this.phase = 'outro';
                    this.timer = 0;
                }
                break;

            case 'outro':
                this.transitionProgress = Math.max(this.transitionProgress - deltaTime / 500, 0);
                if (this.timer > 600) {
                    this.end();
                }
                break;
        }

        this.updateUnitAnimation(this.leftUnit, deltaTime);
        this.updateUnitAnimation(this.rightUnit, deltaTime);
    }

    startTurn() {
        this.phase = 'attack_charge';
        this.timer = 0;
    }

    updateUnitAnimation(unit, deltaTime) {
        if (!unit) return;
        if (!unit.battleFrameTimer) unit.battleFrameTimer = 0;
        unit.battleFrameTimer += deltaTime;

        const interval = 150;
        if (unit.battleFrameTimer >= interval) {
            unit.battleFrameTimer = 0;
            // Only loop if idle, if attacking we rely on phase timing to reset
            if (unit.currentAction === 'idle') {
                unit.frameIndex = (unit.frameIndex + 1) % 4;
            } else {
                // If attacking, cycle but maybe stop at end? 
                // For now cycle is fine as phase resets it to idle
                unit.frameIndex = (unit.frameIndex + 1) % 4;
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Transition
        const t = this.transitionProgress;
        const ease = 1 - Math.pow(1 - t, 3);

        const offsetLeft = -w * 0.5 * (1 - ease);
        const offsetRight = w * 0.5 * (1 - ease);

        // Background
        ctx.globalAlpha = ease;
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, h * 0.75, w, h * 0.25);
        ctx.globalAlpha = 1.0;

        ctx.save();
        ctx.translate(this.shake.x, this.shake.y);

        // Units
        this.renderUnit(ctx, this.leftUnit, this.leftPos.x + offsetLeft, this.leftPos.y, false);
        this.renderUnit(ctx, this.rightUnit, this.rightPos.x + offsetRight, this.rightPos.y, true);

        // Damage Number (Only in HIT phase)
        if (this.phase === 'hit') {
            const turn = this.turns[this.currentTurnIndex];
            const targetUnit = turn.receiver;
            const targetPos = targetUnit === this.leftUnit ? this.leftPos : this.rightPos;

            // Apply offset to target pos for rendering text
            const renderX = targetPos.x + (targetUnit === this.leftUnit ? offsetLeft : offsetRight);

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            const fontSize = Math.max(40, w * 0.1);
            ctx.font = `bold ${fontSize}px "Jersey 20"`;
            ctx.textAlign = 'center';

            const text = `-${turn.damage}`;
            const textY = targetPos.y - (150 * (this.scale / 2));

            ctx.strokeText(text, renderX, textY);
            ctx.fillText(text, renderX, textY);
        }

        ctx.restore();

        // UI
        this.renderUI(ctx, ease);
    }

    renderUnit(ctx, unit, x, y, flip) {
        if (!unit.image || !unit.image.complete) return;

        // Don't render unit that died (prevent flash after death animation)
        if (this.dyingUnit === unit && this.phase === 'outro') {
            return;
        }

        const FRAME_WIDTH = 256;
        const FRAME_HEIGHT = 240;

        // Determine row: 1 if attacking, 0 if idle
        let row = 0;
        if (this.turns && this.turns[this.currentTurnIndex]) {
            const turn = this.turns[this.currentTurnIndex];
            if (unit === turn.attacker && (this.phase === 'attack_anim')) {
                row = 1;
            }
        }

        const sx = unit.frameIndex * FRAME_WIDTH;
        const sy = row * FRAME_HEIGHT;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flip ? -this.scale : this.scale, this.scale);

        // Death Effect: White flash + Fade out
        if (this.phase === 'death' && unit === this.dyingUnit) {
            // White flash: increase brightness
            const flashIntensity = this.deathProgress < 0.3 ? (this.deathProgress / 0.3) : (1 - (this.deathProgress - 0.3) / 0.7);
            ctx.filter = `brightness(${1 + flashIntensity * 1.5}) contrast(${1 + flashIntensity * 0.5})`;

            // Fade out
            ctx.globalAlpha = 1 - this.deathProgress;
        }

        ctx.drawImage(unit.image, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, -FRAME_WIDTH / 2, -FRAME_HEIGHT + 20, FRAME_WIDTH, FRAME_HEIGHT);
        ctx.restore();
    }

    renderUI(ctx, ease) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        const margin = w * 0.05;
        const barWidth = w * 0.4;
        const barHeight = Math.max(50, h * 0.08);
        const topY = 20 - (100 * (1 - ease));

        // Pass visual HP
        this.renderHPBar(ctx, this.leftUnit, this.leftHP, margin, topY, barWidth, barHeight, false);
        this.renderHPBar(ctx, this.rightUnit, this.rightHP, w - margin - barWidth, topY, barWidth, barHeight, true);
    }

    renderHPBar(ctx, unit, currentHP, x, y, width, height, alignRight) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, width, height);

        const nameSize = Math.max(16, width * 0.1);
        const hpSize = Math.max(14, width * 0.08);

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = `${nameSize}px "Jersey 20"`;
        ctx.textAlign = alignRight ? 'right' : 'left';
        ctx.fillText(unit.name, alignRight ? x + width - 10 : x + 10, y + nameSize + 5);

        // HP Bar
        const barH = height * 0.2;
        const barW = width - 20;
        const barX = x + 10;
        const barY = y + height - barH - 10;

        // Background
        ctx.fillStyle = '#555';
        ctx.fillRect(barX, barY, barW, barH);

        // Calculate HP percentage
        const maxHP = unit.maxHealth || 100;
        const pct = Math.max(0, Math.min(1, currentHP / maxHP));

        // Create gradient based on HP percentage (like HUD)
        const gradient = ctx.createLinearGradient(barX, barY, barX + barW, barY);

        if (pct > 0.6) {
            // High HP: Green to Yellow
            gradient.addColorStop(0, '#4ade80'); // Green
            gradient.addColorStop(1, '#fbbf24'); // Yellow
        } else if (pct > 0.3) {
            // Medium HP: Yellow to Orange
            gradient.addColorStop(0, '#fbbf24'); // Yellow
            gradient.addColorStop(1, '#fb923c'); // Orange
        } else {
            // Low HP: Orange to Red
            gradient.addColorStop(0, '#fb923c'); // Orange
            gradient.addColorStop(1, '#ef4444'); // Red
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barW * pct, barH);

        // HP Text (show as "current / max")
        ctx.fillStyle = '#fff';
        ctx.font = `${hpSize}px "Jersey 20"`;
        ctx.fillText(`${Math.floor(currentHP)} / ${maxHP}`, alignRight ? x + width - 10 : x + 10, barY - 5);
    }

    end() {
        this.active = false;
        if (this.onComplete) this.onComplete();
    }
}
