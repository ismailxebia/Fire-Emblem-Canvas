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
