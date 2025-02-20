// js/ui.js

// Fungsi debounce untuk membatasi seberapa sering fungsi dijalankan
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Fungsi untuk mendeteksi perangkat mobile (opsional)
function isMobileDevice() {
  return /Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function setupActionMenu(game) {
  const actionMenu = document.getElementById('actionMenu');
  const confirmMenu = document.getElementById('confirmMenu');

  // Tombol Move: Masuk ke mode move dan siapkan pendingMove
  document.getElementById('btnMove').addEventListener('click', () => {
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

  // Tombol Wait: Tandai bahwa hero telah bertindak dan tidak melakukan perpindahan
  document.getElementById('btnWait').addEventListener('click', () => {
    if (game.battle.selectedHero) {
      game.battle.selectedHero.actionTaken = true;
    }
    actionMenu.style.display = 'none';
    game.battle.selectedHero = null;
    game.battle.actionMode = 'normal';
    updateProfileStatus(null);
  });

  // Tombol Attack (placeholder)
  document.getElementById('btnAttack').addEventListener('click', () => {
    alert('Attack action placeholder');
  });

  // Tombol Magic (placeholder)
  document.getElementById('btnMagic').addEventListener('click', () => {
    alert('Magic action placeholder');
  });

  // Tombol Confirm: Finalisasi perpindahan, tandai bahwa hero telah bertindak
  document.getElementById('btnConfirm').addEventListener('click', () => {
    if (game.battle.pendingMove) {
      game.battle.pendingMove.hero.actionTaken = true;
      game.battle.pendingMove = null;
      confirmMenu.style.display = 'none';
      game.battle.actionMode = 'normal';
      game.battle.selectedHero = null;
      updateProfileStatus(null);
    }
  });

  // Tombol Cancel: Batalkan perpindahan dan kembalikan posisi hero
  document.getElementById('btnCancel').addEventListener('click', () => {
    if (game.battle.pendingMove) {
      const hero = game.battle.pendingMove.hero;
      hero.col = game.battle.pendingMove.originalPosition.col;
      hero.row = game.battle.pendingMove.originalPosition.row;
      game.battle.pendingMove = null;
      confirmMenu.style.display = 'none';
      game.battle.actionMode = 'selected';
      updateProfileStatus(hero);
    }
  });
}

// Fungsi internal untuk update profile status
function _updateProfileStatus(unit) {
  const portraitImg = document.getElementById('heroPortrait');
  const levelTagElem = document.querySelector('.portrait .levelTag');
  const heroNameElem = document.querySelector('.heroName');
  const starsContainer = document.querySelector('.stars');
  const hpFillElem = document.querySelector('.hpFill');
  const hpValueElem = document.querySelector('.hpValue');
  const attributesContainer = document.querySelector('.attributes');

  if (!unit) return;

  // Update gambar: gunakan portraitUrl jika ada, fallback ke spriteUrl
  const newSrc = unit.portraitUrl || unit.spriteUrl || 'https://via.placeholder.com/80';
  if (portraitImg.src !== newSrc) {
    portraitImg.src = newSrc;
  }

  // Update level tag
  levelTagElem.textContent = `LV ${unit.level || 1}`;
  // Update nama
  heroNameElem.textContent = unit.name || 'Unknown';

  // Update stars: asumsikan maksimal 3 bintang
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

  // Update HP bar
  const currentHP = unit.health;
  const maxHP = unit.maxHealth || unit.health;
  const hpPercent = (currentHP / maxHP) * 100;
  hpFillElem.style.width = `${hpPercent}%`;
  hpValueElem.textContent = `${currentHP} / ${maxHP}`;

  // Update atribut/statistik
  attributesContainer.innerHTML = `
    <span class="stat">ATK : ${unit.attack || 0}</span>
    <span class="stat">DEF : ${unit.def || 0}</span>
    <span class="stat">SPD : ${unit.spd || 0}</span>
    <span class="stat">RES : ${unit.res || 0}</span>
  `;
}

// Bungkus _updateProfileStatus dengan debounce untuk hero (300ms)
const debouncedUpdateProfileStatus = debounce(_updateProfileStatus, 300);

// Fungsi updateProfileStatus yang menyesuaikan berdasarkan tipe unit
export function updateProfileStatus(unit) {
  // Jika unit adalah enemy (memiliki properti hexRange), panggil update langsung
  if (unit && unit.hexRange !== undefined) {
    _updateProfileStatus(unit);
  } else {
    debouncedUpdateProfileStatus(unit);
  }
}

// Fungsi untuk menampilkan overlay turn
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
  
  // Ganti newline dengan <br> untuk menampilkan baris baru
  content.innerHTML = text.replace(/\n/g, '<br>');
  
  // Reset animasi
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
