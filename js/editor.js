import { DRAW_ZONE_HEIGHT, DEFAULT_EGG_WIDTH, DEFAULT_EGG_HEIGHT } from './levels.js';
import { createClouds, drawSky, drawClouds, drawDrawZone, drawPlatform, drawSwingArm, drawWater } from './render.js';
import { BadEgg } from './egg.js';
import { getDraft, saveDraft, publishDraft, getPublishedLevels, deleteCustomLevel } from './customLevels.js';

const DEFAULT_SWING_WIDTH = 140;
const DEFAULT_SWING_HEIGHT = 22;
const MIN_DRAG_DISTANCE = 10; // below this, a platform drag is treated as an accidental tap
const MIN_SWING_ARM_LENGTH = 20;
const TOUCH_PADDING = 14; // extra hit-test radius on eggs so small ones stay tappable

function blankDraft() {
  return { name: '', platforms: [], eggs: [], swings: [], published: false, verifiedSnapshot: null };
}

export class Editor {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.active = false;
    this.rafId = null;

    this.tool = 'select'; // 'select' | 'egg' | 'platform' | 'swing'
    this.draft = null;
    this.selected = null; // { type: 'egg'|'platform'|'swing', index }
    this._previewEggs = [];

    this.dragStart = null; // in-progress platform/swing placement drag
    this.dragCurrent = null;
    this.dragMove = null; // in-progress move of a selected shape

    this.clouds = createClouds();

    canvas.addEventListener('pointerdown', (e) => this._handleDown(e));
    canvas.addEventListener('pointermove', (e) => this._handleMove(e));
    window.addEventListener('pointerup', (e) => this._handleUp(e));
    window.addEventListener('pointercancel', (e) => this._handleUp(e));
  }

  // ---- Lifecycle ----

  activate() {
    this.active = true;
    this._newDraftIfNeeded();
    if (!this.rafId) this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  deactivate() {
    this.active = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(timestamp) {
    this.render(timestamp / 1000);
    if (this.active) this.rafId = requestAnimationFrame((t) => this._loop(t));
    else this.rafId = null;
  }

  _newDraftIfNeeded() {
    if (this.draft) return;
    this.draft = getDraft() || blankDraft();
    this.selected = null;
    this.tool = 'select';
    this._syncPreviewEggs();
    this._refreshUI();
  }

  // ---- Tool / property actions (driven by UI wiring in main.js) ----

  setTool(tool) {
    this.tool = tool;
    this.selected = null;
    this._refreshUI();
  }

  setName(name) {
    this.draft.name = name;
    this._save();
  }

  updateSelectedProp(key, delta) {
    if (!this.selected) return;
    const { type, index } = this.selected;
    if (type === 'platform') {
      const p = this.draft.platforms[index];
      if (key === 'width') p.width = Math.max(20, p.width + delta);
      else if (key === 'height') p.height = Math.max(10, p.height + delta);
      else if (key === 'angle') p.angle = (p.angle || 0) + delta;
      else if (key === 'stopper') p.isStopper = !p.isStopper;
    } else if (type === 'egg') {
      if (key === 'pinned') this.draft.eggs[index].pinned = true;
      else if (key === 'rollable') this.draft.eggs[index].pinned = false;
    } else if (type === 'swing') {
      if (key === 'width') this.draft.swings[index].width = Math.max(40, this.draft.swings[index].width + delta);
    }
    this._save();
  }

  deleteSelected() {
    if (!this.selected) return;
    const { type, index } = this.selected;
    if (type === 'egg') this.draft.eggs.splice(index, 1);
    else if (type === 'platform') this.draft.platforms.splice(index, 1);
    else if (type === 'swing') this.draft.swings.splice(index, 1);
    this.selected = null;
    this._save();
  }

  clearDraft() {
    if (this.draft.platforms.length === 0 && this.draft.eggs.length === 0 && this.draft.swings.length === 0) return;
    if (!window.confirm('Clear all eggs, platforms, and swings from this level?')) return;
    this.draft.platforms = [];
    this.draft.eggs = [];
    this.draft.swings = [];
    this.draft.verifiedSnapshot = null;
    this.selected = null;
    this._save();
    this.ui.setEditorMessage('Level cleared.');
  }

  // ---- Test / publish ----

  testLevel(game) {
    if (this.draft.eggs.length === 0) {
      this.ui.setEditorMessage('Add at least one egg before testing.');
      return;
    }
    this.deactivate();
    const levelData = { name: this.draft.name, platforms: this.draft.platforms, eggs: this.draft.eggs, swings: this.draft.swings };
    game.startCustomLevel(levelData, (result) => {
      if (result === 'success') {
        this.draft.verifiedSnapshot = this._snapshot();
        this._save();
        this.ui.setEditorMessage('Cleared it! You can publish now.');
      } else if (result === 'fail') {
        this.ui.setEditorMessage("Didn't clear it in time - try again.");
      }
      this.activate();
      this.ui.showEditor();
    });
  }

  publish() {
    if (this.draft.eggs.length === 0) {
      this.ui.setEditorMessage('Add at least one egg before publishing.');
      return;
    }
    if (!this._isVerified()) {
      this.ui.setEditorMessage('Test the level and beat it before publishing.');
      return;
    }
    publishDraft(this.draft.id);
    this.draft = null;
    this.selected = null;
    this._newDraftIfNeeded();
    this.ui.setEditorName(this.draft.name);
    this.ui.renderPublishedLevelsList(getPublishedLevels());
    this.ui.setEditorMessage('Published! Find it at the end of Level Select.');
  }

  deletePublished(id) {
    deleteCustomLevel(id);
    this.ui.renderPublishedLevelsList(getPublishedLevels());
  }

  // ---- Snapshot / persistence ----

  _snapshot(draft = this.draft) {
    return JSON.stringify({ platforms: draft.platforms, eggs: draft.eggs, swings: draft.swings });
  }

  _isVerified() {
    return !!this.draft.verifiedSnapshot && this.draft.verifiedSnapshot === this._snapshot();
  }

  _save() {
    this.draft = saveDraft(this.draft);
    this._syncPreviewEggs();
    this._refreshUI();
  }

  _syncPreviewEggs() {
    this._previewEggs = this.draft.eggs.map((e, i) => {
      const body = { position: { x: e.x, y: e.y }, angle: 0 };
      const existing = this._previewEggs[i];
      if (existing) {
        existing.body = body;
        existing.width = e.width;
        existing.height = e.height;
        return existing;
      }
      return new BadEgg(e, body);
    });
  }

  _refreshUI() {
    this.ui.setActiveTool(this.tool);
    this.ui.setTestEnabled(this.draft.eggs.length > 0);
    this.ui.setPublishEnabled(this._isVerified() && this.draft.eggs.length > 0);
    this.ui.renderPropertyPanel(this._describeSelection());
    this.ui.renderPublishedLevelsList(getPublishedLevels());
  }

  _describeSelection() {
    if (!this.selected) return null;
    const { type, index } = this.selected;
    const list = type === 'egg' ? this.draft.eggs : type === 'platform' ? this.draft.platforms : this.draft.swings;
    if (index >= list.length) return null;
    return { type, index, data: list[index] };
  }

  // ---- Pointer handling ----

  _toCanvasSpace(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  // Every placement/move lives in the bottom two-thirds - the draw zone is a
  // permanent boundary here, not a momentary player-input state.
  _clamp(p) {
    return { x: p.x, y: Math.max(p.y, DRAW_ZONE_HEIGHT) };
  }

  _handleDown(e) {
    if (!this.active) return;
    e.preventDefault();
    const p = this._clamp(this._toCanvasSpace(e));

    if (this.tool === 'egg') {
      this._placeEgg(p.x, p.y);
      return;
    }
    if (this.tool === 'platform' || this.tool === 'swing') {
      this.dragStart = p;
      this.dragCurrent = p;
      return;
    }
    // Select tool
    const hit = this._hitTest(p.x, p.y);
    this.selected = hit;
    if (hit) {
      const item = this._describeSelection().data;
      this.dragMove = {
        type: hit.type,
        index: hit.index,
        startPointerX: p.x,
        startPointerY: p.y,
        originX: item.x,
        originY: item.y,
        originPivotX: item.pivotX,
        originPivotY: item.pivotY,
      };
    } else {
      this.dragMove = null;
    }
    this._refreshUI();
  }

  _handleMove(e) {
    if (!this.active) return;
    e.preventDefault();
    const p = this._clamp(this._toCanvasSpace(e));

    if ((this.tool === 'platform' || this.tool === 'swing') && this.dragStart) {
      this.dragCurrent = p;
      return;
    }
    if (this.tool === 'select' && this.dragMove) {
      const dx = p.x - this.dragMove.startPointerX;
      const dy = p.y - this.dragMove.startPointerY;
      this._applyMove(dx, dy);
    }
  }

  _handleUp() {
    if (!this.active) return;

    if ((this.tool === 'platform' || this.tool === 'swing') && this.dragStart) {
      this._finalizeDrag();
      this.dragStart = null;
      this.dragCurrent = null;
      return;
    }
    if (this.tool === 'select' && this.dragMove) {
      this.dragMove = null;
      this._save();
    }
  }

  _placeEgg(x, y) {
    const pinned = !this._overlapsAnySwing(x, y);
    this.draft.eggs.push({ x, y, width: DEFAULT_EGG_WIDTH, height: DEFAULT_EGG_HEIGHT, pinned });
    this._save();
  }

  // A pinned (static) egg resting on a swing would just float in place,
  // decoupled from the plank the instant it starts moving - there's no
  // legitimate reason to want that combination, so this is a correction,
  // not a surprising heuristic. Only checked at placement time, not
  // retroactively if a swing is added underneath an egg placed earlier.
  _overlapsAnySwing(x, y) {
    return this.draft.swings.some((s) => {
      const halfW = s.width / 2;
      const halfH = s.height / 2;
      return x >= s.x - halfW && x <= s.x + halfW && y >= s.y - halfH && y <= s.y + halfH;
    });
  }

  _finalizeDrag() {
    const dx = Math.abs(this.dragCurrent.x - this.dragStart.x);
    const dy = Math.abs(this.dragCurrent.y - this.dragStart.y);

    if (this.tool === 'platform') {
      if (dx < MIN_DRAG_DISTANCE && dy < MIN_DRAG_DISTANCE) return;
      const x = (this.dragStart.x + this.dragCurrent.x) / 2;
      const y = (this.dragStart.y + this.dragCurrent.y) / 2;
      this.draft.platforms.push({ x, y, width: Math.max(20, dx), height: Math.max(12, dy), angle: 0 });
      this._save();
    } else if (this.tool === 'swing') {
      if (Math.hypot(dx, dy) < MIN_SWING_ARM_LENGTH) return;
      this.draft.swings.push({
        pivotX: this.dragStart.x,
        pivotY: this.dragStart.y,
        x: this.dragCurrent.x,
        y: this.dragCurrent.y,
        width: DEFAULT_SWING_WIDTH,
        height: DEFAULT_SWING_HEIGHT,
      });
      this._save();
    }
  }

  _applyMove(dx, dy) {
    const { type, index, originX, originY, originPivotX, originPivotY } = this.dragMove;
    if (type === 'egg') {
      const egg = this.draft.eggs[index];
      egg.x = originX + dx;
      egg.y = Math.max(originY + dy, DRAW_ZONE_HEIGHT);
    } else if (type === 'platform') {
      const p = this.draft.platforms[index];
      p.x = originX + dx;
      p.y = Math.max(originY + dy, DRAW_ZONE_HEIGHT);
    } else if (type === 'swing') {
      const s = this.draft.swings[index];
      s.x = originX + dx;
      s.y = Math.max(originY + dy, DRAW_ZONE_HEIGHT);
      s.pivotX = originPivotX + dx;
      s.pivotY = Math.max(originPivotY + dy, DRAW_ZONE_HEIGHT);
    }
  }

  // Eggs first (rendered on top / paint order last), then swings, then
  // platforms - matches z-order so overlap ties resolve to whatever's
  // visually on top.
  _hitTest(x, y) {
    for (let i = this.draft.eggs.length - 1; i >= 0; i--) {
      const egg = this.draft.eggs[i];
      const r = (egg.width + egg.height) / 4 + TOUCH_PADDING;
      if (Math.hypot(x - egg.x, y - egg.y) <= r) return { type: 'egg', index: i };
    }
    for (let i = this.draft.swings.length - 1; i >= 0; i--) {
      const s = this.draft.swings[i];
      if (this._pointInRect(x, y, s.x, s.y, s.width, s.height, 0)) return { type: 'swing', index: i };
    }
    for (let i = this.draft.platforms.length - 1; i >= 0; i--) {
      const p = this.draft.platforms[i];
      if (this._pointInRect(x, y, p.x, p.y, p.width, p.height, p.angle || 0)) return { type: 'platform', index: i };
    }
    return null;
  }

  _pointInRect(px, py, cx, cy, w, h, angleDeg) {
    const rad = -(angleDeg * Math.PI) / 180;
    const dx = px - cx;
    const dy = py - cy;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(localX) <= w / 2 && Math.abs(localY) <= h / 2;
  }

  // ---- Rendering ----

  render(time) {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    drawSky(ctx, this.canvas.width, this.canvas.height);
    drawClouds(ctx, this.clouds, time);
    drawDrawZone(ctx, this.canvas.width);

    for (const p of this.draft.platforms) drawPlatform(ctx, p);
    for (const s of this.draft.swings) drawSwingArm(ctx, s.pivotX, s.pivotY, s.x, s.y, s.width, s.height);
    for (const egg of this._previewEggs) egg.draw(ctx, time);

    this._drawGhostPreview(ctx);
    this._drawSelectionHighlight(ctx);

    drawWater(ctx, this.canvas.width, this.canvas.height, time);
  }

  _drawGhostPreview(ctx) {
    if (!this.dragStart || !this.dragCurrent) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (this.tool === 'platform') {
      const x = (this.dragStart.x + this.dragCurrent.x) / 2;
      const y = (this.dragStart.y + this.dragCurrent.y) / 2;
      const width = Math.max(20, Math.abs(this.dragCurrent.x - this.dragStart.x));
      const height = Math.max(12, Math.abs(this.dragCurrent.y - this.dragStart.y));
      drawPlatform(ctx, { x, y, width, height, angle: 0 });
    } else if (this.tool === 'swing') {
      drawSwingArm(ctx, this.dragStart.x, this.dragStart.y, this.dragCurrent.x, this.dragCurrent.y, DEFAULT_SWING_WIDTH, DEFAULT_SWING_HEIGHT);
    }
    ctx.restore();
  }

  _drawSelectionHighlight(ctx) {
    if (!this.selected) return;
    const item = this._describeSelection()?.data;
    if (!item) return;

    ctx.save();
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);

    if (this.selected.type === 'egg') {
      const r = (item.width + item.height) / 4 + 6;
      ctx.beginPath();
      ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const cx = this.selected.type === 'swing' ? item.x : item.x;
      const cy = this.selected.type === 'swing' ? item.y : item.y;
      ctx.translate(cx, cy);
      ctx.rotate(((item.angle || 0) * Math.PI) / 180);
      ctx.strokeRect(-item.width / 2 - 5, -item.height / 2 - 5, item.width + 10, item.height + 10);
    }
    ctx.restore();
  }
}
