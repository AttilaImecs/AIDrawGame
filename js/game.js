import { LEVELS, parseLevel, COLORS, DESIGN_WIDTH, DESIGN_HEIGHT, WATER_HEIGHT, DRAW_ZONE_HEIGHT } from './levels.js';
import { createWorld, addPlatform, addSwingPlatform, addEgg, addWater, addWorldBounds, addDrawnBody, removeBody, step, onCollisionStart } from './physics.js';
import { Drawing, drawBrushPath, STROKE_THICKNESS } from './drawing.js';
import { BadEgg } from './egg.js';
import { Timer } from './timer.js';
import { playAmbientMusic, stopMusic } from './music.js';
import { getUnlockedCount, markLevelComplete } from './progress.js';

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
    this.swings = [];
    this.drawnBody = null;
    this.drawnLocalPoints = null;
    this.pendingSuccess = false;
    this.successTimer = 0;

    this.timer = new Timer();
    this.clouds = this._createClouds();

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

  _createClouds() {
    const clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        baseX: (DESIGN_WIDTH / 5) * i + DESIGN_WIDTH / 10,
        y: 60 + Math.random() * 220,
        size: 90 + Math.random() * 70,
        amplitude: 40 + Math.random() * 90,
        freq: 0.04 + Math.random() * 0.09,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return clouds;
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
    this.loadLevel(this.levelIndex);
  }

  continueToNextLevel() {
    const next = this.levelIndex + 1;
    if (next < LEVELS.length) {
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
    this.ui.showLevelSelect(getUnlockedCount(LEVELS.length));
  }

  loadLevel(index) {
    const data = LEVELS[index];
    this.level = parseLevel(data);
    this._setupPhysics();
    this.timer.reset();
    this.pendingSuccess = false;
    this.successTimer = 0;
    this.drawing.reset();
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
  }

  _crackEggByBody(body) {
    const egg = this.eggs.find((e) => e.body === body && !e.cracked);
    if (!egg) return;
    egg.crack();
    removeBody(this.engine, body);
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
    markLevelComplete(this.levelIndex, LEVELS.length);
    this.ui.showSuccess(this.level.name, this.levelIndex + 1 < LEVELS.length);
  }

  triggerFail() {
    this.status = STATUS.FAIL;
    stopMusic();
    this.ui.showFail();
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

    this._drawSky(ctx);
    this._drawClouds(ctx, time);

    if (this.status === STATUS.READY || this.status === STATUS.DRAWING) {
      this._drawDrawZone(ctx);
    }

    if (this.level) {
      for (const p of this.level.platforms) this._drawPlatform(ctx, p);
    }

    for (const swing of this.swings) this._drawSwing(ctx, swing);

    for (const egg of this.eggs) egg.draw(ctx, time);

    if (this.drawnBody) {
      this._drawDrawnBody(ctx);
    } else if (this.drawing.isDrawing) {
      drawBrushPath(ctx, this.drawing.points, STROKE_THICKNESS, COLORS.drawn);
    }

    this._drawWater(ctx, time);
  }

  _drawDrawZone(ctx) {
    ctx.fillStyle = COLORS.drawZone;
    ctx.fillRect(0, 0, this.canvas.width, DRAW_ZONE_HEIGHT);
    ctx.strokeStyle = COLORS.drawZoneEdge;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, DRAW_ZONE_HEIGHT);
    ctx.lineTo(this.canvas.width, DRAW_ZONE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawSky(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, COLORS.skyTop);
    grad.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawClouds(ctx, time) {
    ctx.fillStyle = COLORS.cloud;
    for (const c of this.clouds) {
      const x = c.baseX + Math.sin(time * c.freq + c.phase) * c.amplitude;
      ctx.beginPath();
      ctx.ellipse(x, c.y, c.size / 2, c.size * 0.32, 0, 0, Math.PI * 2);
      ctx.ellipse(x + c.size * 0.32, c.y + c.size * 0.06, c.size * 0.34, c.size * 0.24, 0, 0, Math.PI * 2);
      ctx.ellipse(x - c.size * 0.3, c.y + c.size * 0.08, c.size * 0.28, c.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawPlatform(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(((p.angle || 0) * Math.PI) / 180);
    ctx.fillStyle = COLORS.platform;
    ctx.beginPath();
    ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 8);
    ctx.fill();
    ctx.strokeStyle = COLORS.platformEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  _drawSwing(ctx, swing) {
    const { cfg, body } = swing;
    ctx.strokeStyle = COLORS.platformEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cfg.pivotX, cfg.pivotY);
    ctx.lineTo(body.position.x, body.position.y);
    ctx.stroke();

    ctx.fillStyle = COLORS.platformEdge;
    ctx.beginPath();
    ctx.arc(cfg.pivotX, cfg.pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    this._drawPlatform(ctx, { x: body.position.x, y: body.position.y, width: cfg.width, height: cfg.height, angle: 0 });
  }

  _drawWater(ctx, time) {
    const waterTop = DESIGN_HEIGHT - WATER_HEIGHT;
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(0, waterTop, this.canvas.width, WATER_HEIGHT);

    ctx.strokeStyle = COLORS.waterHighlight;
    ctx.lineWidth = 4;
    for (let row = 0; row < 3; row++) {
      const y = waterTop + 18 + row * 22;
      ctx.beginPath();
      for (let x = 0; x <= DESIGN_WIDTH; x += 12) {
        const wave = Math.sin(time * 2 + x * 0.05 + row) * 4;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.waterFoam;
    ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.1;
    ctx.fillRect(0, waterTop, this.canvas.width, 4);
    ctx.globalAlpha = 1;
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
