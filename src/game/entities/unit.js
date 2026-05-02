// js/entities/unit.js
export default class Unit {
  constructor(name, col, row, health, attack) {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.maxHealth = health;
    this.attack = attack;

    // Death animation lifecycle
    this.isDying = false;
    this.dead = false;
    this.deathTimer = 0;
    this.deathDuration = 700; // ms
  }

  moveTo(col, row) {
    this.col = col;
    this.row = row;
  }

  receiveDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  isAlive() {
    return this.health > 0 && !this.dead;
  }

  startDeath() {
    if (this.isDying || this.dead) return;
    this.isDying = true;
    this.deathTimer = 0;
  }

  tickDeath(deltaTime) {
    if (!this.isDying || this.dead) return;
    this.deathTimer += deltaTime;
    if (this.deathTimer >= this.deathDuration) {
      this.dead = true;
    }
  }

  // Returns 0..1 where 1 means fully gone. 0 if not dying.
  get deathProgress() {
    if (!this.isDying) return 0;
    return Math.min(this.deathTimer / this.deathDuration, 1);
  }
}
