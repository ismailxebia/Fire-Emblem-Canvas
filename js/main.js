// js/main.js
import Game from './game.js';
import { handleInput } from './input.js';
import { setupActionMenu } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

const canvasContainer = document.getElementById('canvasContainer');
canvasContainer.addEventListener('scroll', () => {
  const scrollTop = canvasContainer.scrollTop;
  const maxScroll = canvasContainer.scrollHeight - canvasContainer.clientHeight;
  const maxCamera = window.gameInstance.grid.stageHeight - canvasContainer.clientHeight;
  const ratio = maxScroll ? (maxCamera / maxScroll) : 1;
  window.gameInstance.camera.y = scrollTop * ratio;
});

function resizeCanvas() {
  const statusContainer = document.getElementById('statusContainer');
  const statusHeight = statusContainer ? statusContainer.offsetHeight : 0;
  const canvasContainer = document.getElementById('canvasContainer');
  // Set container tinggi agar memenuhi sisa layar.
  canvasContainer.style.height = (window.innerHeight - statusHeight) + 'px';

  // Atur lebar canvas
  canvas.width = window.innerWidth;
  if (window.gameInstance) {
    const stageHeight = window.gameInstance.grid.stageHeight;
    canvas.height = stageHeight > (window.innerHeight - statusHeight)
      ? stageHeight
      : (window.innerHeight - statusHeight);
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
