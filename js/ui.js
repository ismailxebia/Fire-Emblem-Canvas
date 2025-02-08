// js/ui.js
export function setupActionMenu(game) {
    const actionMenu = document.getElementById('actionMenu');
    const confirmMenu = document.getElementById('confirmMenu');
  
    // Tombol Move: masuk ke mode move
    document.getElementById('btnMove').addEventListener('click', () => {
      game.battle.actionMode = 'move';
      actionMenu.style.display = 'none';
    });
  
    // Tombol Wait: hero menunggu (skip aksi)
    document.getElementById('btnWait').addEventListener('click', () => {
      if (game.battle.selectedHero) {
        game.battle.selectedHero.waited = true;
      }
      actionMenu.style.display = 'none';
      game.battle.selectedHero = null;
      game.battle.actionMode = 'normal';
    });
  
    // Tombol Attack dan Magic (placeholder)
    document.getElementById('btnAttack').addEventListener('click', () => {
      alert('Attack action placeholder');
    });
    document.getElementById('btnMagic').addEventListener('click', () => {
      alert('Magic action placeholder');
    });
  
    // Tombol Confirm: konfirmasi perpindahan (move)
    document.getElementById('btnConfirm').addEventListener('click', () => {
      if (game.battle.pendingMove) {
        // Finalisasi move: posisi baru diterapkan dan pendingMove dihapus
        game.battle.pendingMove = null;
        confirmMenu.style.display = 'none';
        game.battle.actionMode = 'normal';
        // Deselect hero setelah aksi selesai
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
  