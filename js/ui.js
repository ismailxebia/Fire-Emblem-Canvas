// js/ui.js

export function setupActionMenu(game) {
  const actionMenu = document.getElementById('actionMenu');
  const confirmMenu = document.getElementById('confirmMenu');
  const btnAttackConfirm = document.getElementById('btnAttackConfirm');
  const btnConfirm = document.getElementById('btnConfirm');
  const btnCancel = document.getElementById('btnCancel');

  // Tombol Move: Masuk ke mode move dan siapkan pendingMove
  document.getElementById('btnMove').addEventListener('click', () => {
    game.attackMode = false; // non-attack mode
    btnAttackConfirm.style.display = 'none';
    btnConfirm.style.display = 'inline-block'; // untuk mode move
    if (game.battle.selectedHero) {
      game.battle.actionMode = 'move';
      if (!game.battle.pendingMove) {
        game.battle.pendingMove = {
          hero: game.battle.selectedHero,
          originalPosition: {
            col: game.battle.selectedHero.col,
            row: game.battle.selectedHero.row
          },
          newPosition: null
        };
      }
      updateProfileStatus(game.battle.selectedHero);
    }
    actionMenu.style.display = 'none';
  });

  // Tombol Wait: Tandai hero telah bertindak (tanpa move)
  document.getElementById('btnWait').addEventListener('click', () => {
    if (game.battle.selectedHero) {
      game.battle.selectedHero.actionTaken = true;
    }
    game.attackMode = false;
    btnAttackConfirm.style.display = 'none';
    btnConfirm.style.display = 'inline-block';
    actionMenu.style.display = 'none';
    game.battle.selectedHero = null;
    game.battle.actionMode = 'normal';
    updateProfileStatus(null);
  });

  // Tombol Attack (di action menu):
  // Masuk ke attack mode, tampilkan confirmMenu dengan hanya tombol Cancel
  document.getElementById('btnAttack').addEventListener('click', () => {
    if (game.battle.selectedHero && !game.battle.selectedHero.actionTaken) {
      const hero = game.battle.selectedHero;
      // Cek apakah ada enemy dalam attack range (untuk memunculkan tombol di actionMenu jika dibutuhkan)
      let canAttack = false;
      for (let enemy of game.battle.enemies) {
        const distance = Math.abs(hero.col - enemy.col) + Math.abs(hero.row - enemy.row);
        if (distance <= hero.attackRange) {
          canAttack = true;
          break;
        }
      }
      // Masuk attack mode
      game.attackMode = true;
      game.battle.actionMode = 'selected';
      actionMenu.style.display = 'none';
      // Tampilkan confirmMenu, namun sembunyikan tombol AttackConfirm dan Confirm
      confirmMenu.style.display = 'block';
      btnAttackConfirm.style.display = 'none';
      btnConfirm.style.display = 'none';
      // Hanya tombol Cancel yang harus tampil
      btnCancel.style.display = 'inline-block';
      updateProfileStatus(hero);
    }
  });

  // Tombol Magic (placeholder)
  document.getElementById('btnMagic').addEventListener('click', () => {
    alert('Magic action placeholder');
  });

  // Tombol Confirm: Finalisasi perpindahan (mode move)
  btnConfirm.addEventListener('click', () => {
    if (game.battle.pendingMove) {
      game.battle.pendingMove.hero.actionTaken = true;
      game.battle.pendingMove = null;
      confirmMenu.style.display = 'none';
      game.battle.actionMode = 'normal';
      game.attackMode = false;
      btnAttackConfirm.style.display = 'none';
      btnConfirm.style.display = 'inline-block';
      game.battle.selectedHero = null;
      updateProfileStatus(null);
    }
  });

  // Tombol Attack Confirm: (Placeholder, tidak aktif di fase attack)
  btnAttackConfirm.addEventListener('click', () => {
    if (game.battle.selectedHero && game.attackMode) {
      alert('Attack action executed (via Attack Confirm placeholder)');
      game.battle.selectedHero.actionTaken = true;
      game.battle.actionMode = 'normal';
      game.attackMode = false;
      btnAttackConfirm.style.display = 'none';
      confirmMenu.style.display = 'none';
      updateProfileStatus(null);
    }
  });

  // Tombol Cancel: Batalkan move/attack, kembalikan posisi hero atau batalkan attack mode
  btnCancel.addEventListener('click', () => {
    if (game.battle.pendingMove) {
      // Batalkan perpindahan (mode move)
      const hero = game.battle.pendingMove.hero;
      hero.col = game.battle.pendingMove.originalPosition.col;
      hero.row = game.battle.pendingMove.originalPosition.row;
      game.battle.pendingMove = null;
      confirmMenu.style.display = 'none';
      game.battle.actionMode = 'selected';
      game.attackMode = false;
      btnAttackConfirm.style.display = 'none';
      btnConfirm.style.display = 'inline-block';
      updateProfileStatus(hero);
    } else if (game.attackMode) {
      // Jika di fase attack (tanpa pending move), batalkan attack mode
      confirmMenu.style.display = 'none';
      game.attackMode = false;
      game.battle.actionMode = 'selected';
      // Tampilkan kembali actionMenu dengan tombol Attack dan Wait (sesuai kebutuhan)
      actionMenu.style.display = 'block';
      updateProfileStatus(game.battle.selectedHero);
    }
  });
}

export function updateProfileStatus(unit) {
  const portraitImg = document.getElementById('heroPortrait');
  const levelTagElem = document.querySelector('.portrait .levelTag');
  const heroNameElem = document.querySelector('.heroName');
  const starsContainer = document.querySelector('.stars');
  const hpFillElem = document.querySelector('.hpFill');
  const hpValueElem = document.querySelector('.hpValue');
  const attributesContainer = document.querySelector('.attributes');

  if (!unit) return;

  portraitImg.src = unit.portraitUrl || unit.spriteUrl || 'https://via.placeholder.com/80';
  levelTagElem.textContent = `LV ${unit.level || 1}`;
  heroNameElem.textContent = unit.name || 'Unknown';

  let starHTML = '';
  const maxStars = 3;
  const activeStars = unit.star || 1;
  for (let i = 0; i < maxStars; i++) {
    if (i < activeStars) {
      starHTML += '<img src="assets/star-on.svg" alt="Star On" class="star on">';
    } else {
      starHTML += '<img src="assets/star-off.svg" alt="Star Off" class="star off">';
    }
  }
  starsContainer.innerHTML = starHTML;

  const currentHP = unit.health;
  const maxHP = unit.maxHealth || unit.health;
  const hpPercent = (currentHP / maxHP) * 100;
  hpFillElem.style.width = `${hpPercent}%`;
  hpValueElem.textContent = `${currentHP} / ${maxHP}`;

  attributesContainer.innerHTML = `
    <span class="stat">ATK : ${unit.attack || 0}</span>
    <span class="stat">DEF : ${unit.def || 0}</span>
    <span class="stat">SPD : ${unit.spd || 0}</span>
    <span class="stat">RES : ${unit.res || 0}</span>
  `;
}

export function showTurnOverlay(text) {
  const overlay = document.getElementById('turnOverlay');
  if (!overlay) {
    console.warn("Element #turnOverlay tidak ditemukan di DOM.");
    return;
  }
  const content = overlay.querySelector('.overlayContent');
  if (!content) {
    console.warn("Elemen .overlayContent tidak ditemukan di dalam #turnOverlay.");
    return;
  }
  
  content.innerHTML = text.replace(/\n/g, '<br>');
  
  content.style.opacity = '0';
  content.style.transform = 'translateY(-20px)';
  overlay.style.display = 'flex';
  void content.offsetWidth;
  
  content.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  content.style.opacity = '1';
  content.style.transform = 'translateY(0)';
  
  window.gameOverlayActive = true;
  
  setTimeout(() => {
    content.style.opacity = '0';
    content.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      overlay.style.display = 'none';
      window.gameOverlayActive = false;
      content.style.transition = '';
    }, 800);
  }, 3000);
}
