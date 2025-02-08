// js/ui.js
export function setupActionMenu(game) {
    const actionMenu = document.getElementById('actionMenu');
    const confirmMenu = document.getElementById('confirmMenu');
  
    document.getElementById('btnMove').addEventListener('click', () => {
      if (game.battle.selectedHero) {
        game.battle.actionMode = 'move';
        // Jika belum ada pendingMove, set originalPosition dari posisi hero saat ini
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
      }
      // Sembunyikan action menu setelah memilih Move
      actionMenu.style.display = 'none';
    });
  
    // Tombol Wait (dan placeholder untuk Attack/Magic) seperti sebelumnya
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
  
    // Tombol Confirm: konfirmasi perpindahan
    document.getElementById('btnConfirm').addEventListener('click', () => {
      if (game.battle.pendingMove) {
        // Finalisasi perpindahan
        game.battle.pendingMove = null;
        confirmMenu.style.display = 'none';
        game.battle.actionMode = 'normal';
        game.battle.selectedHero = null;
      }
    });
  
    // Tombol Cancel: batalkan perpindahan dan kembalikan posisi semula
    document.getElementById('btnCancel').addEventListener('click', () => {
      if (game.battle.pendingMove) {
        const hero = game.battle.pendingMove.hero;
        hero.col = game.battle.pendingMove.originalPosition.col;
        hero.row = game.battle.pendingMove.originalPosition.row;
        game.battle.pendingMove = null;
        confirmMenu.style.display = 'none';
        game.battle.actionMode = 'selected';
      }
    });
  }
  