import { Game } from './game.js';
import { UI } from './ui.js';
import { Editor } from './editor.js';

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
const editor = new Editor(canvas, ui);

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
// During a custom-level test-play, the level-select icon aborts back to the
// editor instead of the normal level select screen.
ui.onLevelSelectIcon(() => {
  if (game.isCustomTest) {
    game.abortCustomTest();
  } else {
    game.goToLevelSelect();
  }
});

ui.onOpenEditor(() => {
  game.pause();
  editor.activate();
  ui.setEditorName(editor.draft.name);
  ui.setEditorMessage('');
  ui.showEditor();
});
ui.onEditorBack(() => {
  editor.deactivate();
  game.goToMenu();
});
ui.onEditorToolSelect((tool) => editor.setTool(tool));
ui.onEditorNameInput((name) => editor.setName(name));
ui.onEditorPropertyAction((action, delta) => {
  if (action === 'delete') editor.deleteSelected();
  else editor.updateSelectedProp(action, delta);
});
ui.onEditorTest(() => editor.testLevel(game));
ui.onEditorPublish(() => editor.publish());
ui.onEditorClear(() => editor.clearDraft());
ui.onDeletePublishedLevel((id) => editor.deletePublished(id));

ui.showMenu();
