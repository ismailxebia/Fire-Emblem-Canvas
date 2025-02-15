// js/main.js
import Game from './game.js';
import { handleInput } from './input.js';
import { setupActionMenu } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

function resizeCanvas() {
  const statusContainer = document.getElementById('statusContainer');
  const statusHeight = statusContainer ? statusContainer.offsetHeight : 0;
  const canvasContainer = document.getElementById('canvasContainer');
  canvasContainer.style.height = (window.innerHeight - statusHeight) + 'px';

  // Kita atur canvas width sama dengan layar
  canvas.width = window.innerWidth;
  // Dan canvas height diatur sesuai grid stage (misalnya, grid.stageHeight)
  // Jika grid belum diinisialisasi, gunakan container height sebagai fallback.
  if (window.gameInstance) {
    const stageHeight = window.gameInstance.grid.stageHeight;
    canvas.height = stageHeight > (window.innerHeight - statusHeight) ? stageHeight : (window.innerHeight - statusHeight);
  } else {
    canvas.height = window.innerHeight - statusHeight;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.gameInstance = new Game(canvas, ctx);
setupActionMenu(window.gameInstance);

function gameLoop(timestamp) {
  window.gameInstance.update(timestamp);
  window.gameInstance.render(ctx);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
