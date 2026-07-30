import { Game } from './game.js';
import { UI } from './ui.js';

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

// Play always starts at level 1 - Level Select (which lists every level
// while progress-gating is disabled, see progress.js) is how to jump ahead.
ui.onPlay(() => game.startLevel(0));
ui.onLevelSelectFromMenu(() => game.goToLevelSelect());
ui.onSelectLevel((index) => game.startLevel(index));
ui.onBackToMenu(() => game.goToMenu());
ui.onContinue(() => game.continueToNextLevel());
ui.onMenuFromSuccess(() => game.goToMenu());
ui.onRetry(() => game.retryLevel());
ui.onMenuFromFail(() => game.goToMenu());
ui.onLevelSelectIcon(() => game.goToLevelSelect());

ui.showMenu();
