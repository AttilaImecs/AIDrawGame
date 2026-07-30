import { LEVELS } from './levels.js';

export class UI {
  constructor() {
    this.hud = document.getElementById('hud');
    this.timerDisplay = document.getElementById('timer-display');

    this.screenMenu = document.getElementById('screen-menu');
    this.screenLevelSelect = document.getElementById('screen-level-select');
    this.screenSuccess = document.getElementById('screen-success');
    this.screenFail = document.getElementById('screen-fail');

    this.successText = document.getElementById('success-text');

    this.btnPlay = document.getElementById('btn-play');
    this.btnLevelSelectMenu = document.getElementById('btn-level-select-menu');
    this.levelSelectGroup = document.getElementById('level-select-group');
    this.btnBackToMenu = document.getElementById('btn-back-to-menu');
    this.btnContinue = document.getElementById('btn-continue');
    this.btnMenuSuccess = document.getElementById('btn-menu-success');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnMenuFail = document.getElementById('btn-menu-fail');
    this.btnRetryIcon = document.getElementById('btn-retry-icon');
    this.btnLevelSelectIcon = document.getElementById('btn-level-select-icon');

    this.screens = [this.screenMenu, this.screenLevelSelect, this.screenSuccess, this.screenFail];

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeScreen = this.screens.find((s) => !s.classList.contains('hidden'));
        if (!activeScreen) return;

        let target;
        if (activeScreen === this.screenMenu) target = this.btnPlay;
        else if (activeScreen === this.screenSuccess) target = this.btnContinue;
        else if (activeScreen === this.screenFail) target = this.btnRetry;

        if (target) {
          e.preventDefault();
          target.click();
        }
      }
    });
  }

  buildLevelSelectButtons(unlockedCount) {
    this.levelSelectGroup.innerHTML = '';
    LEVELS.forEach((level, index) => {
      if (index >= unlockedCount) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary level-btn';
      btn.textContent = `${index + 1}. ${level.name}`;
      btn.dataset.level = String(index);
      this.levelSelectGroup.appendChild(btn);
    });
  }

  hideAllScreens() {
    for (const screen of this.screens) screen.classList.add('hidden');
    this.hud.classList.add('hidden');
  }

  showMenu() {
    this.hideAllScreens();
    this.screenMenu.classList.remove('hidden');
  }

  showLevelSelect(unlockedCount) {
    this.hideAllScreens();
    this.buildLevelSelectButtons(unlockedCount);
    this.screenLevelSelect.classList.remove('hidden');
  }

  showPlaying() {
    this.hideAllScreens();
    this.hud.classList.remove('hidden');
  }

  showSuccess(levelName, hasNext) {
    this.hideAllScreens();
    this.successText.textContent = `${levelName} cleared!`;
    this.btnContinue.textContent = hasNext ? 'Continue' : 'Menu';
    this.screenSuccess.classList.remove('hidden');
  }

  showFail() {
    this.hideAllScreens();
    this.screenFail.classList.remove('hidden');
  }

  updateHUD(timerText, isWarning) {
    this.timerDisplay.textContent = timerText;
    this.timerDisplay.classList.toggle('warning', isWarning);
  }

  onPlay(callback) {
    this.btnPlay.addEventListener('click', callback);
  }

  onLevelSelectFromMenu(callback) {
    this.btnLevelSelectMenu.addEventListener('click', callback);
  }

  onSelectLevel(callback) {
    this.levelSelectGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.level-btn');
      if (btn) callback(Number(btn.dataset.level));
    });
  }

  onBackToMenu(callback) {
    this.btnBackToMenu.addEventListener('click', callback);
  }

  onContinue(callback) {
    this.btnContinue.addEventListener('click', callback);
  }

  onMenuFromSuccess(callback) {
    this.btnMenuSuccess.addEventListener('click', callback);
  }

  onRetry(callback) {
    this.btnRetry.addEventListener('click', callback);
    this.btnRetryIcon.addEventListener('click', callback);
  }

  onMenuFromFail(callback) {
    this.btnMenuFail.addEventListener('click', callback);
  }

  onLevelSelectIcon(callback) {
    this.btnLevelSelectIcon.addEventListener('click', callback);
  }
}
