// js/main.js
import Game from './game.js';
import { handleInput } from './input.js';
import { setupActionMenu } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;

  function resizeCanvas() {
    const statusContainer = document.getElementById('statusContainer');
    const statusHeight = statusContainer ? statusContainer.offsetHeight : 0;
    const canvasContainer = document.getElementById('canvasContainer');
    if (!canvasContainer) {
      return;
    }
    canvasContainer.style.height = (window.innerHeight - statusHeight) + 'px';

    // Kita atur canvas width sama dengan layar
    canvas.width = window.innerWidth;
    // Dan canvas height diatur sesuai grid stage (fallback jika belum inisialisasi)
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

  // Loading Screen Logic
  const loadingScreen = document.getElementById('loadingScreen');
  const loadingPercent = document.querySelector('.loadingPercent');
  let progress = 0;

  // Simulate loading progress
  const loadingInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 1; // Random increment
    if (progress > 100) progress = 100;

    if (loadingPercent) {
      loadingPercent.textContent = `${progress}%`;
    }

    if (progress >= 100) {
      clearInterval(loadingInterval);
      setTimeout(() => {
        // Fade out loading screen
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Start game logic here if needed, or just let it run
          }, 500);
        }
      }, 500); // Short delay at 100%
    }
  }, 50); // Update every 50ms -> approx 2-3 seconds total

  window.addEventListener('load', () => {
    if (/Android|iPhone|iPad/.test(navigator.userAgent) && !sessionStorage.getItem('autoReloadDone')) {
      sessionStorage.setItem('autoReloadDone', 'true');
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  });
});
