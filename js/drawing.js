import { computeHull } from './physics.js';
import { DRAW_ZONE_HEIGHT } from './levels.js';

export const STROKE_THICKNESS = 12;
const MIN_POINT_DISTANCE = 6;

// Deterministic pseudo-random in [0,1) from a numeric seed - used for brush-dab
// jitter so the painted texture stays stable frame-to-frame instead of flickering.
function hashRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export class Drawing {
  constructor(canvas) {
    this.canvas = canvas;
    this.points = [];
    this.isDrawing = false;
    this.hasDrawn = false;
    this.onStart = null;
    this.onFinish = null;
    // Off while the level editor owns the canvas, so a tap inside the
    // top-third zone while editing isn't also captured as a draw attempt -
    // these listeners are attached for the app's whole lifetime and
    // otherwise have no notion of whether a level is even running.
    this.enabled = true;

    canvas.addEventListener('pointerdown', (e) => this._handleDown(e));
    canvas.addEventListener('pointermove', (e) => this._handleMove(e));
    window.addEventListener('pointerup', (e) => this._handleUp(e));
    window.addEventListener('pointercancel', (e) => this._handleUp(e));
  }

  _toCanvasSpace(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  _handleDown(e) {
    if (!this.enabled) return;
    // Strict one-object-per-attempt guard: once a stroke has been finished,
    // every further pointerdown is a total no-op until reset() is called.
    if (this.hasDrawn || this.isDrawing) return;
    const p = this._toCanvasSpace(e);
    // Drawing only starts inside the top-third zone (see the translucent
    // overlay in game.js) - a touch/click below it is a no-op, same as if
    // the player had already used their one attempt.
    if (p.y > DRAW_ZONE_HEIGHT) return;
    e.preventDefault();
    this.isDrawing = true;
    this.points = [p];
    try {
      this.canvas.setPointerCapture?.(e.pointerId);
    } catch (err) {
      // Invalid/unsupported pointer id - capture is a nice-to-have, not required.
    }
    if (this.onStart) this.onStart();
  }

  _handleMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const p = this._toCanvasSpace(e);
    // Clamp instead of rejecting: if the pointer drifts below the drawable
    // zone mid-stroke, keep the shape pinned at the boundary rather than
    // dropping points, so the stroke stays smooth and can't reach eggs.
    p.y = Math.min(p.y, DRAW_ZONE_HEIGHT);
    const last = this.points[this.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) >= MIN_POINT_DISTANCE) {
      this.points.push(p);
    }
  }

  _handleUp() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.points.length < 2) {
      // Too short to be a real stroke (e.g. a stray tap) - don't burn the attempt.
      this.points = [];
      return;
    }
    this.hasDrawn = true;
    const hull = computeHull(this.points);
    if (this.onFinish) this.onFinish({ points: this.points.slice(), hull });
  }

  reset() {
    this.isDrawing = false;
    this.hasDrawn = false;
    this.points = [];
  }
}

// Stamps overlapping soft-edged circular dabs along `points` for a painted-brush
// look instead of a crisp vector stroke. `points` may be in world or local
// (body-relative) space - caller sets up the canvas transform beforehand.
export function drawBrushPath(ctx, points, thickness, color = '#1a1a1a') {
  if (points.length === 0) return;

  ctx.save();
  ctx.fillStyle = color;
  const baseRadius = thickness / 2;
  const spacing = Math.max(2, thickness * 0.35);

  const stamp = (x, y, seed) => {
    const r = baseRadius * (0.85 + hashRandom(seed) * 0.3);
    ctx.globalAlpha = 0.85 + hashRandom(seed + 0.37) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  stamp(points[0].x, points[0].y, 0);
  let seed = 1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.round(dist / spacing));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      stamp(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, seed++);
    }
  }
  ctx.restore();
}
