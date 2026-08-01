import { getCombinedLevels } from './customLevels.js';

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

    this.btnOpenEditor = document.getElementById('btn-open-editor');
    this.screenEditor = document.getElementById('screen-editor');
    this.editorToolbar = document.getElementById('editor-toolbar');
    this.editorNameInput = document.getElementById('editor-name-input');
    this.editorMessage = document.getElementById('editor-message');
    this.editorPropertyPanel = document.getElementById('editor-property-panel');
    this.btnEditorTest = document.getElementById('btn-editor-test');
    this.btnEditorPublish = document.getElementById('btn-editor-publish');
    this.btnEditorBack = document.getElementById('btn-editor-back');
    this.editorPublishedList = document.getElementById('editor-published-list');

    // screenEditor is deliberately NOT in this list (see hideAllScreens) -
    // the keyboard handler below would otherwise hijack Space while typing
    // a level name.
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
    getCombinedLevels().forEach((level, index) => {
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
    this.screenEditor.classList.add('hidden');
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

  showEditor() {
    this.hideAllScreens();
    this.screenEditor.classList.remove('hidden');
  }

  setEditorName(name) {
    this.editorNameInput.value = name || '';
  }

  setEditorMessage(text) {
    this.editorMessage.textContent = text || '';
  }

  setActiveTool(tool) {
    this.editorToolbar.querySelectorAll('.tool-btn').forEach((btn) => {
      const active = btn.dataset.tool === tool;
      btn.classList.toggle('btn-primary', active);
      btn.classList.toggle('btn-secondary', !active);
    });
  }

  setTestEnabled(enabled) {
    this.btnEditorTest.disabled = !enabled;
  }

  setPublishEnabled(enabled) {
    this.btnEditorPublish.disabled = !enabled;
  }

  renderPropertyPanel(selection) {
    this.editorPropertyPanel.innerHTML = '';
    if (!selection) return;
    const { type, data } = selection;

    const stepper = (label, field, step) => {
      const row = document.createElement('div');
      row.className = 'stepper';
      const lbl = document.createElement('span');
      lbl.className = 'stepper-label';
      lbl.textContent = label;
      const minus = document.createElement('button');
      minus.className = 'stepper-btn';
      minus.textContent = '−';
      minus.dataset.action = field;
      minus.dataset.delta = String(-step);
      const value = document.createElement('span');
      value.className = 'stepper-value';
      value.textContent = Math.round(data[field] || 0);
      const plus = document.createElement('button');
      plus.className = 'stepper-btn';
      plus.textContent = '+';
      plus.dataset.action = field;
      plus.dataset.delta = String(step);
      row.append(lbl, minus, value, plus);
      return row;
    };

    if (type === 'platform') {
      this.editorPropertyPanel.append(stepper('Width', 'width', 10), stepper('Height', 'height', 5), stepper('Angle', 'angle', 5));
      const stopperBtn = document.createElement('button');
      stopperBtn.className = `btn ${data.isStopper ? 'btn-primary' : 'btn-secondary'}`;
      stopperBtn.textContent = data.isStopper ? 'Stopper: On' : 'Stopper: Off';
      stopperBtn.dataset.action = 'stopper';
      this.editorPropertyPanel.appendChild(stopperBtn);
    } else if (type === 'egg') {
      const pinned = data.pinned !== false;
      const pinnedBtn = document.createElement('button');
      pinnedBtn.className = `btn ${pinned ? 'btn-primary' : 'btn-secondary'}`;
      pinnedBtn.textContent = 'Pinned';
      pinnedBtn.dataset.action = 'pinned';
      const rollableBtn = document.createElement('button');
      rollableBtn.className = `btn ${!pinned ? 'btn-primary' : 'btn-secondary'}`;
      rollableBtn.textContent = 'Rollable';
      rollableBtn.dataset.action = 'rollable';
      this.editorPropertyPanel.append(pinnedBtn, rollableBtn);
    } else if (type === 'swing') {
      this.editorPropertyPanel.append(stepper('Width', 'width', 10));
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-secondary';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.action = 'delete';
    this.editorPropertyPanel.appendChild(deleteBtn);
  }

  renderPublishedLevelsList(levels) {
    this.editorPublishedList.innerHTML = '';
    for (const level of levels) {
      const row = document.createElement('div');
      row.className = 'published-row';
      const name = document.createElement('span');
      name.textContent = level.name || 'Untitled level';
      const del = document.createElement('button');
      del.className = 'btn btn-secondary';
      del.textContent = 'Delete';
      del.dataset.id = level.id;
      row.append(name, del);
      this.editorPublishedList.appendChild(row);
    }
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

  onOpenEditor(callback) {
    this.btnOpenEditor.addEventListener('click', callback);
  }

  onEditorBack(callback) {
    this.btnEditorBack.addEventListener('click', callback);
  }

  onEditorToolSelect(callback) {
    this.editorToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (btn) callback(btn.dataset.tool);
    });
  }

  onEditorNameInput(callback) {
    this.editorNameInput.addEventListener('input', () => callback(this.editorNameInput.value));
  }

  onEditorPropertyAction(callback) {
    this.editorPropertyPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const delta = btn.dataset.delta !== undefined ? Number(btn.dataset.delta) : undefined;
      callback(btn.dataset.action, delta);
    });
  }

  onEditorTest(callback) {
    this.btnEditorTest.addEventListener('click', callback);
  }

  onEditorPublish(callback) {
    this.btnEditorPublish.addEventListener('click', callback);
  }

  onDeletePublishedLevel(callback) {
    this.editorPublishedList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-id]');
      if (btn) callback(btn.dataset.id);
    });
  }
}
