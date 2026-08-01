import { parseLevel, COLORS, DESIGN_WIDTH, DESIGN_HEIGHT, WATER_HEIGHT } from './levels.js';
import { createWorld, addPlatform, addSwingPlatform, addEgg, addCat, addWater, addWorldBounds, addDrawnBody, removeBody, step, onCollisionStart } from './physics.js';
import { Drawing, drawBrushPath, STROKE_THICKNESS } from './drawing.js';
import { BadEgg } from './egg.js';
import { Cat, CAT_FAIL_DELAY } from './cat.js';
import { Timer } from './timer.js';
import { playAmbientMusic, stopMusic } from './music.js';
import { getUnlockedCount, markLevelComplete } from './progress.js';
import { createClouds, drawSky, drawClouds, drawDrawZone, drawPlatform, drawSwingArm, drawWater } from './render.js';
import { getCombinedLevels } from './customLevels.js';

export const STATUS = {
  MENU: 'menu',
  LEVEL_SELECT: 'level_select',
  READY: 'ready',
  DRAWING: 'drawing',
  ACTIVE: 'active',
  SUCCESS: 'success',
  FAIL: 'fail',
};

const SUCCESS_DELAY = 0.5;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.status = STATUS.MENU;
    this.levelIndex = 0;
    this.lastTimestamp = 0;
    this.rafId = null;
    this.scale = 1;

    this.engine = null;
    this.level = null;
    this.eggs = [];
    this.cats = [];
    this.swings = [];
    this.drawnBody = null;
    this.drawnLocalPoints = null;
    this.pendingSuccess = false;
    this.successTimer = 0;
    this.catKilled = false;
    this.catFailTimer = 0;
    this.isCustomTest = false;
    this.customTestCallback = null;
    this._customLevelData = null;

    this.timer = new Timer();
    this.clouds = createClouds();

    this.drawing = new Drawing(canvas);
    this.drawing.onStart = () => this._onDrawStart();
    this.drawing.onFinish = (stroke) => this._onDrawFinish(stroke);

    this.resizeCanvas = this.resizeCanvas.bind(this);
    window.addEventListener('resize', this.resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.resizeCanvas);
    }
    this.resizeCanvas();
    this.render(0);
  }

  resizeCanvas() {
    const vv = window.visualViewport;
    // Reserve room for the picture-frame border/mat drawn around the canvas.
    const FRAME_CHROME = 40;
    const maxWidth = (vv ? vv.width : window.innerWidth) - FRAME_CHROME;
    const maxHeight = (vv ? vv.height : window.innerHeight) - FRAME_CHROME;

    const scale = Math.min(1, maxWidth / DESIGN_WIDTH, maxHeight / DESIGN_HEIGHT);

    this.canvas.width = DESIGN_WIDTH;
    this.canvas.height = DESIGN_HEIGHT;
    this.canvas.style.width = `${DESIGN_WIDTH * scale}px`;
    this.canvas.style.height = `${DESIGN_HEIGHT * scale}px`;
    this.scale = scale;
  }

  // ---- Flow control ----

  start() {
    this.startLevel(0);
  }

  startLevel(index) {
    this.levelIndex = index;
    this.loadLevel(index);
  }

  retryLevel() {
    if (this.isCustomTest) {
      // this.levelIndex isn't a meaningful combined-list index during a
      // custom test - replay the exact draft data instead of looking it up.
      this._startWithLevelData(this._customLevelData);
    } else {
      this.loadLevel(this.levelIndex);
    }
  }

  continueToNextLevel() {
    const next = this.levelIndex + 1;
    if (next < getCombinedLevels().length) {
      this.startLevel(next);
    } else {
      this.goToMenu();
    }
  }

  goToMenu() {
    this.status = STATUS.MENU;
    this.stopLoop();
    stopMusic();
    this.ui.showMenu();
  }

  goToLevelSelect() {
    this.status = STATUS.LEVEL_SELECT;
    this.stopLoop();
    stopMusic();
    this.ui.showLevelSelect(getUnlockedCount(getCombinedLevels().length));
  }

  loadLevel(index) {
    this.isCustomTest = false;
    const data = getCombinedLevels()[index];
    this._startWithLevelData(data);
  }

  // Test-play a draft from the level editor through the real engine -
  // physics, timer, HUD, the works - without touching progress tracking or
  // the normal success/fail screens (see triggerSuccess/triggerFail).
  // `onResult` is called with 'success' | 'fail' | 'abort'.
  startCustomLevel(levelData, onResult) {
    this.isCustomTest = true;
    this.customTestCallback = onResult;
    this._customLevelData = levelData;
    this._startWithLevelData(levelData);
  }

  abortCustomTest() {
    this.pause();
    const callback = this.customTestCallback;
    this.customTestCallback = null;
    callback?.('abort');
  }

  // Stops the loop/music/drawing without changing status - used when the
  // level editor opens over a level that's mid-play.
  pause() {
    this.stopLoop();
    stopMusic();
    this.drawing.enabled = false;
  }

  _startWithLevelData(data) {
    this.level = parseLevel(data);
    this._setupPhysics();
    this.timer.reset();
    this.pendingSuccess = false;
    this.successTimer = 0;
    this.catKilled = false;
    this.catFailTimer = 0;
    this.drawing.reset();
    this.drawing.enabled = true;
    this.status = STATUS.READY;
    this.ui.showPlaying();
    playAmbientMusic();
    this.lastTimestamp = 0;
    this.startLoop();
  }

  _setupPhysics() {
    this.engine = createWorld();
    for (const p of this.level.platforms) addPlatform(this.engine, p);
    this.eggs = this.level.eggs.map((e) => new BadEgg(e, addEgg(this.engine, e)));
    this.cats = this.level.cats.map((c) => new Cat(c, addCat(this.engine, c)));
    this.swings = this.level.swings.map((cfg) => ({ cfg, body: addSwingPlatform(this.engine, cfg) }));
    addWater(this.engine, {
      x: DESIGN_WIDTH / 2,
      y: DESIGN_HEIGHT - WATER_HEIGHT / 2,
      width: DESIGN_WIDTH,
      height: WATER_HEIGHT,
    });
    addWorldBounds(this.engine, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.drawnBody = null;
    this.drawnLocalPoints = null;

    onCollisionStart(this.engine, (a, b) => this._handleCollision(a, b));
  }

  _handleCollision(a, b) {
    const labels = [a.label, b.label];
    if (labels.includes('drawn') && labels.includes('egg')) {
      this._crackEggByBody(a.label === 'egg' ? a : b);
    }
    if (labels.includes('water') && labels.includes('egg')) {
      this._crackEggByBody(a.label === 'egg' ? a : b);
    }
    if (labels.includes('drawn') && labels.includes('cat')) {
      this._killCatByBody(a.label === 'cat' ? a : b);
    }
  }

  _crackEggByBody(body) {
    const egg = this.eggs.find((e) => e.body === body && !e.cracked);
    if (!egg) return;
    egg.crack();
    removeBody(this.engine, body);
  }

  _killCatByBody(body) {
    const cat = this.cats.find((c) => c.body === body && !c.killed);
    if (!cat) return;
    cat.kill();
    removeBody(this.engine, body);
    this.catKilled = true;
  }

  _onDrawStart() {
    if (this.status !== STATUS.READY) return;
    this.status = STATUS.DRAWING;
  }

  _onDrawFinish(stroke) {
    if (this.status !== STATUS.DRAWING) return;
    if (stroke.hull.length < 3) {
      // Degenerate (near-collinear) scribble - let the player try again instead
      // of burning their one attempt on a shape with no real area.
      this.drawing.reset();
      this.status = STATUS.READY;
      return;
    }
    const { body, centre } = addDrawnBody(this.engine, stroke.hull, STROKE_THICKNESS);
    this.drawnBody = body;
    this.drawnLocalPoints = stroke.points.map((p) => ({ x: p.x - centre.x, y: p.y - centre.y }));
    this.status = STATUS.ACTIVE;
    this.timer.start();
  }

  triggerSuccess() {
    this.status = STATUS.SUCCESS;
    stopMusic();
    if (this.isCustomTest) {
      // Return before touching any ui.show* method - the editor renders its
      // own inline result, and ui.js stays unaware the editor exists.
      this.customTestCallback?.('success');
      return;
    }
    const totalLevels = getCombinedLevels().length;
    markLevelComplete(this.levelIndex, totalLevels);
    this.ui.showSuccess(this.level.name, this.levelIndex + 1 < totalLevels);
  }

  triggerFail(reason = 'Out of time!') {
    this.status = STATUS.FAIL;
    stopMusic();
    if (this.isCustomTest) {
      this.customTestCallback?.('fail', reason);
      return;
    }
    this.ui.showFail(reason);
  }

  // ---- Loop ----

  startLoop() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop(timestamp) {
    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.render(timestamp / 1000);

    if (this.status === STATUS.READY || this.status === STATUS.DRAWING || this.status === STATUS.ACTIVE) {
      this.ui.updateHUD(this.timer.format(), this.timer.isWarning());
      this.rafId = requestAnimationFrame((ts) => this.loop(ts));
    } else {
      this.rafId = null;
    }
  }

  update(dt) {
    if (this.status !== STATUS.ACTIVE) return;

    step(this.engine, dt);

    for (const egg of this.eggs) egg.update(dt);
    this.eggs = this.eggs.filter((egg) => !egg.isFinished());
    for (const cat of this.cats) cat.update(dt);

    if (this.catKilled) {
      this.catFailTimer += dt;
      if (this.catFailTimer >= CAT_FAIL_DELAY) {
        this.triggerFail('You hurt the cat! Try again.');
      }
      return;
    }

    const remaining = this.eggs.filter((e) => !e.cracked).length;

    if (remaining === 0) {
      if (!this.pendingSuccess) {
        this.pendingSuccess = true;
        this.successTimer = 0;
      } else {
        this.successTimer += dt;
      }
      if (this.successTimer >= SUCCESS_DELAY) {
        this.triggerSuccess();
      }
      return;
    }

    this.timer.update(dt);
    if (this.timer.isExpired()) {
      this.triggerFail();
    }
  }

  // ---- Rendering ----

  render(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    drawSky(ctx, this.canvas.width, this.canvas.height);
    drawClouds(ctx, this.clouds, time);

    if (this.status === STATUS.READY || this.status === STATUS.DRAWING) {
      drawDrawZone(ctx, this.canvas.width);
    }

    if (this.level) {
      for (const p of this.level.platforms) drawPlatform(ctx, p);
    }

    for (const swing of this.swings) {
      drawSwingArm(ctx, swing.cfg.pivotX, swing.cfg.pivotY, swing.body.position.x, swing.body.position.y, swing.cfg.width, swing.cfg.height);
    }

    for (const egg of this.eggs) egg.draw(ctx, time);
    for (const cat of this.cats) cat.draw(ctx, time);

    if (this.drawnBody) {
      this._drawDrawnBody(ctx);
    } else if (this.drawing.isDrawing) {
      drawBrushPath(ctx, this.drawing.points, STROKE_THICKNESS, COLORS.drawn);
    }

    drawWater(ctx, this.canvas.width, this.canvas.height, time);
  }

  _drawDrawnBody(ctx) {
    const body = this.drawnBody;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    drawBrushPath(ctx, this.drawnLocalPoints, STROKE_THICKNESS, COLORS.drawn);
    ctx.restore();
  }
}
