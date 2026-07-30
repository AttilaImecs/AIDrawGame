import { Game } from './game.js';
import { UI } from './ui.js';
import { LEVELS } from './levels.js';
import { getUnlockedCount } from './progress.js';

// Register service worker for offline PWA install. Failures are non-fatal
// (e.g. http://localhost in some browsers blocks SW).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

const canvas = document.getElementById('game-canvas');
const ui = new UI();
const game = new Game(canvas, ui);

ui.onPlay(() => {
  const index = Math.max(0, Math.min(getUnlockedCount(LEVELS.length) - 1, LEVELS.length - 1));
  game.startLevel(index);
});
ui.onLevelSelectFromMenu(() => game.goToLevelSelect());
ui.onSelectLevel((index) => game.startLevel(index));
ui.onBackToMenu(() => game.goToMenu());
ui.onContinue(() => game.continueToNextLevel());
ui.onMenuFromSuccess(() => game.goToMenu());
ui.onRetry(() => game.retryLevel());
ui.onMenuFromFail(() => game.goToMenu());
ui.onLevelSelectIcon(() => game.goToLevelSelect());

ui.showMenu();
