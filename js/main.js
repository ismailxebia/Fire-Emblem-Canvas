// js/main.js
import Game from './game.js';
import { handleInput } from './input.js';
import { setupActionMenu } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (window.gameInstance) {
    window.gameInstance.grid.updateDimensions(canvas.width);
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
 