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
    // Tidak memanggil updateProfileStatus(null) agar data sebelumnya tetap dipertahankan.
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

/**
 * updateProfileStatus: Mengupdate konten status profil berdasarkan unit yang dipilih.
 * Jika unit bernilai null, fungsi ini tidak melakukan perubahan sehingga data sebelumnya tetap terlihat.
 */
export function updateProfileStatus(unit) {
  // Ambil elemen-elemen DOM yang diperlukan.
  const portraitImg = document.getElementById('heroPortrait');
  const nameElem = document.querySelector('#profileStatus .statsColumn .name');
  const statsColumn = document.querySelector('#profileStatus .statsColumn');
  const levelStarElem = document.querySelector('#profileStatus .levelSkillColumn .level-star');
  const skillsContainer = document.querySelector('#profileStatus .levelSkillColumn .skills');

  // Jika unit null, jangan ubah konten (biarkan data sebelumnya)
  if (!unit) {
    return;
  }

  portraitImg.src = unit.portraitUrl || unit.spriteUrl || 'https://via.placeholder.com/80';
  nameElem.textContent = unit.name || 'Unknown';

  // Update statistik unit (gunakan properti yang ada, dengan fallback default)
  const hpText = `HP: ${unit.health}/${unit.maxHealth || unit.health}`;
  const atkText = `ATK : ${unit.attack}`;
  const spdText = `SPD : ${unit.spd}`;
  const defText = `DEF : ${unit.def}`;
  const resText = `RES : ${unit.res}`;
  statsColumn.innerHTML = `
      <div class="name">${unit.name || 'Unknown'}</div>
      <div class="stat">${hpText}</div>
      <div class="attribute">
        <div class="stat">${atkText}</div>
        <div class="stat">${spdText}</div>
      </div>
      <div class="attribute">
        <div class="stat">${defText}</div>
        <div class="stat">${resText}</div>
      </div>
    `;
  // Update level dan stars – asumsikan properti "level" dan "stars" ada.
  levelStarElem.innerHTML = `<span class="heroLevel">LV: ${unit.level || 1}</span>
      <span class="heroStars">${unit.stars ? '★'.repeat(unit.stars) : '★'}</span>`;
  // Update skills – jika unit memiliki array "skills", tampilkan; jika tidak, gunakan placeholder.
  if (unit.skills && unit.skills.length > 0) {
    skillsContainer.innerHTML = unit.skills.map(skill => `<div class="skill">${skill.name}</div>`).join('');
  } else {
    skillsContainer.innerHTML = `
        <div class="skill">Skill 1</div>
        <div class="skill">Skill 2</div>
        <div class="skill">Skill 3</div>
      `;
  }
}
