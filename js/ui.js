// js/ui.js
export function setupActionMenu(game) {
  const actionMenu = document.getElementById('actionMenu');
  const confirmMenu = document.getElementById('confirmMenu');

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

  document.getElementById('btnWait').addEventListener('click', () => {
    if (game.battle.selectedHero) {
      game.battle.selectedHero.waited = true;
    }
    actionMenu.style.display = 'none';
    game.battle.selectedHero = null;
    game.battle.actionMode = 'normal';
  });

  document.getElementById('btnAttack').addEventListener('click', () => {
    alert('Attack action placeholder');
  });

  document.getElementById('btnMagic').addEventListener('click', () => {
    alert('Magic action placeholder');
  });

  document.getElementById('btnConfirm').addEventListener('click', () => {
    if (game.battle.pendingMove) {
      game.battle.pendingMove = null;
      confirmMenu.style.display = 'none';
      game.battle.actionMode = 'normal';
      game.battle.selectedHero = null;
      // Jangan hapus data profile status
    }
  });

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

export function updateProfileStatus(unit) {
  // Ambil elemen-elemen DOM yang diperlukan dari status container baru
  const portraitImg = document.getElementById('heroPortrait');
  const levelTagElem = document.querySelector('.portrait .levelTag');
  const heroNameElem = document.querySelector('.heroName');
  const starsContainer = document.querySelector('.stars');
  const hpFillElem = document.querySelector('.hpFill');
  const hpValueElem = document.querySelector('.hpValue');
  const attributesContainer = document.querySelector('.attributes');

  // Jika unit null, kita bisa mengosongkan atau tidak mengubah status (sesuai keinginan)
  if (!unit) return;

  // Update portrait: gunakan portraitUrl jika ada, atau fallback ke spriteUrl
  portraitImg.src = unit.portraitUrl || unit.spriteUrl || 'https://via.placeholder.com/80';

  // Update level tag (misalnya "LV 12")
  levelTagElem.textContent = `LV ${unit.level || 1}`;

  // Update hero name
  heroNameElem.textContent = unit.name || 'Unknown';

  // Update stars: Misalnya, tampilkan bintang aktif sesuai jumlah star unit
  // Asumsikan unit.star adalah angka, dan maksimal bintang adalah 3
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

  // Update HP bar: Hitung persentase HP
  const currentHP = unit.health;
  const maxHP = unit.maxHealth || unit.health; // fallback jika maxHealth tidak ada
  const hpPercent = (currentHP / maxHP) * 100;
  hpFillElem.style.width = `${hpPercent}%`;

  // Update nilai HP numerik
  hpValueElem.textContent = `${currentHP} / ${maxHP}`;

  // Update attributes: asumsikan unit memiliki properti atk, def, spd, res
  attributesContainer.innerHTML = `
    <span class="stat">ATK : ${unit.attack || 0}</span>
    <span class="stat">DEF : ${unit.def || 0}</span>
    <span class="stat">SPD : ${unit.spd || 0}</span>
    <span class="stat">RES : ${unit.res || 0}</span>
  `;
}
