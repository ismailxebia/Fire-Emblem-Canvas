
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

        this.battleGrass = new Image();
        this.battleGrass.src = 'assets/battle-grass.png';
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
        // Use logical (CSS) dimensions, not internal DPR-scaled dimensions
        const w = this.game.canvas.clientWidth || this.game.canvas.width;
        const h = this.game.canvas.clientHeight || this.game.canvas.height;

        // Calculate grass dimensions to position units
        let centerY = h * 0.75; // Default fallback
        if (this.battleGrass && this.battleGrass.complete && this.battleGrass.naturalWidth > 0) {
            const img = this.battleGrass;
            const halfW = w / 2;
            const minH = h * 0.35;
            const scale = Math.max(halfW / img.width, minH / img.height);
            const drawH = img.height * scale;
            const drawY = h - drawH;

            // Position at vertical center of the grass area
            // Adjust to align feet with the grass surface (approx 35% from top of image)
            centerY = drawY + (drawH * 0.45);
        }

        // Center vertically (Feet position)
        // Move units slightly closer to center
        this.leftPos = { x: w * 0.25, y: centerY };
        this.rightPos = { x: w * 0.75, y: centerY };

        // Reduced scale further
        // Base scale 0.65 on 400px width (was 0.7)
        this.scale = Math.max(0.5, Math.min(1.4, (w / 400) * 0.65));
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

        // Use logical (CSS) dimensions, not internal DPR-scaled dimensions
        const w = ctx.canvas.clientWidth || ctx.canvas.width;
        const h = ctx.canvas.clientHeight || ctx.canvas.height;

        // Transition
        const t = this.transitionProgress;
        const ease = 1 - Math.pow(1 - t, 3);

        const offsetLeft = -w * 0.5 * (1 - ease);
        const offsetRight = w * 0.5 * (1 - ease);

        // Background Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h);

        // Draw Grass
        if (this.battleGrass && this.battleGrass.complete && this.battleGrass.naturalWidth > 0) {
            const img = this.battleGrass;
            const halfW = w / 2;

            // Scale logic: Cover width, but ensure min height for mobile
            // We want the grass to be at least 35% of screen height
            const minH = h * 0.35;
            const scale = Math.max(halfW / img.width, minH / img.height);

            const drawW = halfW;
            const drawH = img.height * scale;
            const drawY = h - drawH;

            // Source dimensions (crop outer edges if needed)
            const sWidth = halfW / scale;
            const sHeight = img.height;

            // Left Side (Mirrored)
            ctx.save();
            ctx.translate(halfW + offsetLeft, 0); // Start at center
            ctx.scale(-1, 1); // Mirror
            // Draw from left side of image (seam)
            ctx.drawImage(img, 0, 0, sWidth, sHeight, 0, drawY, drawW, drawH);
            ctx.restore();

            // Right Side (Normal)
            ctx.save();
            ctx.translate(halfW + offsetRight, 0); // Start at center
            // Draw from left side of image (seam)
            ctx.drawImage(img, 0, 0, sWidth, sHeight, 0, drawY, drawW, drawH);
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;

        ctx.save();
        ctx.translate(this.shake.x, this.shake.y);

        // Compute attack lunge / knockback offsets for current turn
        const turn = this.turns && this.turns[this.currentTurnIndex];
        const attackerIsLeft = turn && turn.attacker === this.leftUnit;
        const lunge = this._attackerLungeOffset();   // signed magnitude (toward target)
        const knock = this._receiverKnockbackOffset(); // signed magnitude (away from attacker)

        // Left moves +x to attack, right moves -x to attack
        const leftAttackDX = (turn && attackerIsLeft) ? lunge : 0;
        const rightAttackDX = (turn && !attackerIsLeft) ? -lunge : 0;
        const leftReceiveDX = (turn && !attackerIsLeft) ? -knock : 0;
        const rightReceiveDX = (turn && attackerIsLeft) ? knock : 0;

        // Units
        this.renderUnit(
            ctx, this.leftUnit,
            this.leftPos.x + offsetLeft + leftAttackDX + leftReceiveDX,
            this.leftPos.y,
            true
        );
        this.renderUnit(
            ctx, this.rightUnit,
            this.rightPos.x + offsetRight + rightAttackDX + rightReceiveDX,
            this.rightPos.y,
            false
        );

        // Damage Number (Only in HIT phase)
        if (this.phase === 'hit') {
            const turn2 = this.turns[this.currentTurnIndex];
            const targetUnit = turn2.receiver;
            const targetPos = targetUnit === this.leftUnit ? this.leftPos : this.rightPos;

            // Track receiver's actual rendered position (with knockback) so the number sticks
            const receiverDX = targetUnit === this.leftUnit ? leftReceiveDX : rightReceiveDX;
            const renderX = targetPos.x + (targetUnit === this.leftUnit ? offsetLeft : offsetRight) + receiverDX;

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            const fontSize = Math.max(40, w * 0.1);
            ctx.font = `bold ${fontSize}px "Jersey 20"`;
            ctx.textAlign = 'center';

            const text = `-${turn2.damage}`;
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
        const w = ctx.canvas.clientWidth || ctx.canvas.width;
        const h = ctx.canvas.clientHeight || ctx.canvas.height;

        const margin = Math.max(12, w * 0.04);
        const panelWidth = Math.min(w * 0.42, 280);
        const panelHeight = 70;
        const slideOffset = (1 - ease) * 120;
        const topY = 16 + (1 - ease) * -40;

        // Left panel slides in from left, right slides in from right
        this.renderHPPanel(
            ctx, this.leftUnit, this.leftHP,
            margin - slideOffset, topY, panelWidth, panelHeight, false
        );
        this.renderHPPanel(
            ctx, this.rightUnit, this.rightHP,
            w - margin - panelWidth + slideOffset, topY, panelWidth, panelHeight, true
        );
    }

    renderHPPanel(ctx, unit, currentHP, x, y, width, height, alignRight) {
        ctx.save();

        // Panel background — Octopath dark plate with gold border
        const grad = ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, 'rgba(28, 36, 56, 0.96)');
        grad.addColorStop(1, 'rgba(13, 19, 32, 0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, width, height);

        // Border (1px gold)
        ctx.strokeStyle = 'rgba(216, 184, 106, 0.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

        // Top accent strip
        const accentGrad = ctx.createLinearGradient(x, y, x + width, y);
        accentGrad.addColorStop(0, 'rgba(216, 184, 106, 0)');
        accentGrad.addColorStop(0.5, 'rgba(240, 210, 124, 0.85)');
        accentGrad.addColorStop(1, 'rgba(216, 184, 106, 0)');
        ctx.fillStyle = accentGrad;
        ctx.fillRect(x + 6, y, width - 12, 1);

        const padX = 12;
        const nameSize = 18;
        const hpSize = 14;

        // === Top row: name (one side) | HP value (other side) ===
        ctx.font = `700 ${nameSize}px "Jersey 20", serif`;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = '#e9e4d4';
        ctx.textAlign = alignRight ? 'right' : 'left';
        const nameX = alignRight ? x + width - padX : x + padX;
        const nameY = y + 10;
        // Truncate long names to fit half panel width
        const maxNameWidth = width - padX * 2 - 80;
        let displayName = unit.name || '';
        if (ctx.measureText(displayName).width > maxNameWidth) {
            while (displayName.length > 1 && ctx.measureText(displayName + '…').width > maxNameWidth) {
                displayName = displayName.slice(0, -1);
            }
            displayName += '…';
        }
        ctx.fillText(displayName, nameX, nameY);

        // HP value on opposite side, same row
        const maxHP = unit.maxHealth || 100;
        ctx.font = `700 ${hpSize}px "Jersey 20", serif`;
        ctx.fillStyle = '#d8b86a';
        ctx.textAlign = alignRight ? 'left' : 'right';
        const hpX = alignRight ? x + padX : x + width - padX;
        ctx.fillText(`${Math.floor(currentHP)} / ${maxHP}`, hpX, nameY + 3);

        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetY = 0;

        // === Bottom row: HP bar ===
        const barH = 8;
        const barW = width - padX * 2;
        const barX = x + padX;
        const barY = y + height - padX - barH + 4;

        // Bar track
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = 'rgba(216, 184, 106, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

        // Bar fill — gradient by HP percentage
        const pct = Math.max(0, Math.min(1, currentHP / maxHP));
        const fillGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        if (pct > 0.6) {
            fillGrad.addColorStop(0, '#7adf8d');
            fillGrad.addColorStop(1, '#2d8c3e');
        } else if (pct > 0.3) {
            fillGrad.addColorStop(0, '#fbcf5a');
            fillGrad.addColorStop(1, '#c97c2a');
        } else {
            fillGrad.addColorStop(0, '#ff8870');
            fillGrad.addColorStop(1, '#b03020');
        }
        ctx.fillStyle = fillGrad;
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);

        // Glossy highlight on top of fill
        if (pct > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, Math.max(1, (barH - 2) * 0.4));
        }

        ctx.restore();
    }

    end() {
        this.active = false;
        if (this.onComplete) this.onComplete();
    }

    // === Lunge / knockback animation ===
    // Returns positive offset (in px) along the attacker's facing direction.
    // Phases:
    //   attack_charge (0–200ms) : pull back  (anticipation)
    //   attack_anim   (0–400ms) : surge forward to peak by ~60%, hold to end
    //   hit           (0–800ms) : recoil back to origin in first 40%
    _attackerLungeOffset() {
        if (!this.turns || !this.turns[this.currentTurnIndex]) return 0;
        const w = this.game.canvas.clientWidth || this.game.canvas.width || 400;
        const maxLunge = Math.min(w * 0.16, 90);
        const pullback = Math.min(w * 0.035, 22);

        if (this.phase === 'attack_charge') {
            const t = Math.min(this.timer / 200, 1);
            return -this._easeOutCubic(t) * pullback;
        }
        if (this.phase === 'attack_anim') {
            const t = Math.min(this.timer / 400, 1);
            // Quick surge from -pullback to +maxLunge over first 55%, hold at peak after
            if (t < 0.55) {
                const k = t / 0.55;
                const eased = this._easeOutCubic(k);
                return -pullback + eased * (maxLunge + pullback);
            }
            return maxLunge;
        }
        if (this.phase === 'hit') {
            const t = Math.min(this.timer / 800, 1);
            // Snap back over first 40%
            if (t < 0.4) {
                const k = t / 0.4;
                return maxLunge * (1 - this._easeInOutQuad(k));
            }
            return 0;
        }
        return 0;
    }

    // Receiver pushed away briefly on impact, then springs back.
    // Trigger only during the very start of `hit` phase.
    _receiverKnockbackOffset() {
        if (!this.turns || !this.turns[this.currentTurnIndex]) return 0;
        if (this.phase !== 'hit') return 0;
        const w = this.game.canvas.clientWidth || this.game.canvas.width || 400;
        const peak = Math.min(w * 0.045, 28);
        const t = Math.min(this.timer / 350, 1); // brief
        // Out-and-back: sin curve, peak at t=0.4
        return Math.sin(Math.min(t / 0.6, 1) * Math.PI) * peak;
    }

    _easeOutCubic(t) {
        const k = 1 - t;
        return 1 - k * k * k;
    }

    _easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}
