// js/entities/unit.js
export default class Unit {
  constructor(name, col, row, health, attack) {
    this.name = name;
    this.col = col;
    this.row = row;
    this.health = health;
    this.maxHealth = health; // Store original max HP
    this.attack = attack;
    // Tambahkan properti lain seperti movementRange, defense, dsb.
  }

  moveTo(col, row) {
    // Logika pergerakan, misalnya validasi pergerakan jika diperlukan
    this.col = col;
    this.row = row;
  }

  receiveDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  isAlive() {
    return this.health > 0;
  }
}
