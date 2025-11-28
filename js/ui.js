// js/ui.js

export function setupActionMenu(game) {
  const actionMenu = document.getElementById('actionMenu');
  const confirmMenu = document.getElementById('confirmMenu');
  const btnAttackConfirm = document.getElementById('btnAttackConfirm');
  const btnConfirm = document.getElementById('btnConfirm');
  const btnCancel = document.getElementById('btnCancel');

  // Tombol Move
  document.getElementById('btnMove').addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.activateMoveMode();
  });

  // Tombol Wait (Action Menu)
  document.getElementById('btnWait').addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.wait();
  });

  // Tombol Attack (Action Menu)
  document.getElementById('btnAttack').addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.activateAttackMode('physical');
  });

  // Tombol Magic (Action Menu)
  document.getElementById('btnMagic').addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.activateAttackMode('magic');
  });

  // Tombol Confirm (Wait in Confirm Menu)
  btnConfirm.addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.wait();
  });

  // Tombol Attack Confirm (Attack from new position)
  btnAttackConfirm.addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.activateAttackMode('physical');
  });

  // Tombol Magic Confirm
  const btnMagicConfirm = document.getElementById('btnMagicConfirm');
  if (btnMagicConfirm) {
    btnMagicConfirm.addEventListener('click', () => {
      if (game.actionSystem) game.actionSystem.activateAttackMode('magic');
    });
  }

  // Tombol Cancel
  btnCancel.addEventListener('click', () => {
    if (game.actionSystem) game.actionSystem.cancelAction();
  });
}

export function updateProfileStatus(unit) {
  if (!unit) return;

  const portrait = document.getElementById('heroPortrait');
  const nameEl = document.querySelector('.heroName');
  const starsEl = document.querySelector('.stars');
  const hpFill = document.querySelector('.hpFill');
  const hpValue = document.querySelector('.hpValue');
  const stats = document.querySelectorAll('.stat');

  // Update Portrait
  if (unit.portraitUrl) {
    portrait.src = unit.portraitUrl;
  } else {
    portrait.src = '';
  }

  // Update Name
  nameEl.textContent = unit.name;

  // Update Stars (Rarity)
  starsEl.innerHTML = '';
  const rarity = unit.rarity || 3;
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('img');
    star.classList.add('star');
    star.src = 'assets/Star.png';
    if (i >= rarity) {
      star.classList.add('off');
    }
    starsEl.appendChild(star);
  }

  // Update HP
  const maxHP = unit.maxHealth || 100;
  const currentHP = Math.max(0, unit.health);
  const hpPercent = (currentHP / maxHP) * 100;

  hpFill.style.width = `${hpPercent}%`;
  hpValue.textContent = `${currentHP} / ${maxHP}`;

  // Update Stats
  if (stats.length >= 4) {
    stats[0].textContent = `ATK : ${unit.attack || 0}`;
    stats[1].textContent = `DEF : ${unit.def || 0}`;
    stats[2].textContent = `SPD : ${unit.speed || 0}`;
    stats[3].textContent = `RES : ${unit.res || 0}`;
  }
}

export function showTurnOverlay(text) {
  const overlay = document.getElementById('turnOverlay');
  if (!overlay) {
    console.warn("Element #turnOverlay tidak ditemukan di DOM.");
    return;
  }
  const turnText = overlay.querySelector('.turnText');
  if (!turnText) {
    console.warn("Element .turnText tidak ditemukan di DOM.");
    return;
  }

  // Set text
  turnText.textContent = text;

  // Reset state
  overlay.classList.remove('fadeOut');
  overlay.style.display = 'block';

  // Trigger enter animation
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Start fade out after 2 seconds
  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.classList.add('fadeOut');

    // Hide completely after fade out
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('fadeOut');
    }, 500);
  }, 2000);
}
