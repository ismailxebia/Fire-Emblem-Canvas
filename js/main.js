// js/main.js
import Game from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Jika game sudah dibuat, perbarui grid dimensions
  if (window.gameInstance) {
    window.gameInstance.grid.updateDimensions(canvas.width);
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.gameInstance = new Game(canvas, ctx);

function gameLoop(timestamp) {
  window.gameInstance.update(timestamp);
  window.gameInstance.render(ctx);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
