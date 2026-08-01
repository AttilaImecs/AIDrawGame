import { COLORS } from './levels.js';

const BLINK_CYCLE = 3.4;
const BLINK_DURATION = 0.15;
// How long the death fade-out takes - game.js waits this exact amount of
// time after a kill before flipping to the fail screen, so the animation
// always finishes right as the screen changes.
export const CAT_FAIL_DELAY = 0.5;

export class Cat {
  constructor(config, body) {
    this.width = config.width;
    this.height = config.height;
    this.body = body;
    this.killed = false;
    this.killTimer = 0;
    // Stagger blink timing per cat so multiple cats don't blink in unison.
    this.blinkOffset = Math.random() * BLINK_CYCLE;
  }

  get x() {
    return this.body.position.x;
  }

  get y() {
    return this.body.position.y;
  }

  kill() {
    if (this.killed) return;
    this.killed = true;
    this.killTimer = 0;
  }

  update(dt) {
    if (this.killed) this.killTimer += dt;
  }

  draw(ctx, time) {
    const rx = this.width / 2;
    const ry = this.height / 2;
    const baseAlpha = this.killed ? Math.max(0, 1 - this.killTimer / CAT_FAIL_DELAY) : 1;
    if (baseAlpha <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.body.angle);
    ctx.globalAlpha = baseAlpha;

    this._drawEars(ctx, rx, ry);

    ctx.fillStyle = COLORS.catFur;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = baseAlpha * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.4, rx * 0.5, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = baseAlpha;

    this._drawWhiskers(ctx, rx, ry);
    this._drawFace(ctx, rx, ry, time);

    ctx.restore();
  }

  _drawEars(ctx, rx, ry) {
    ctx.fillStyle = COLORS.catFur;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * rx * 0.5, -ry * 0.7);
      ctx.lineTo(dir * rx * 0.95, -ry * 1.3);
      ctx.lineTo(dir * rx * 0.15, -ry * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.catEarInner;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * rx * 0.55, -ry * 0.78);
      ctx.lineTo(dir * rx * 0.82, -ry * 1.13);
      ctx.lineTo(dir * rx * 0.35, -ry * 0.88);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawWhiskers(ctx, rx, ry) {
    ctx.strokeStyle = COLORS.catFeature;
    ctx.lineWidth = Math.max(1.5, rx * 0.045);
    ctx.lineCap = 'round';
    const originY = ry * 0.15;
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * ry * 0.12;
        ctx.beginPath();
        ctx.moveTo(dir * rx * 0.35, originY + spread);
        ctx.lineTo(dir * rx * 1.15, originY + spread * 1.6);
        ctx.stroke();
      }
    }
  }

  _drawFace(ctx, rx, ry, time) {
    const eyeDX = rx * 0.35;
    const eyeY = -ry * 0.05;
    const eyeRadius = rx * 0.14;

    ctx.fillStyle = COLORS.catFeature;
    ctx.strokeStyle = COLORS.catFeature;
    ctx.lineCap = 'round';

    if (this.killed) {
      // X eyes read as "startled, not hurt" - this game keeps things light.
      ctx.lineWidth = Math.max(2, rx * 0.1);
      for (const dir of [-1, 1]) {
        const cx = dir * eyeDX;
        const s = eyeRadius * 0.9;
        ctx.beginPath();
        ctx.moveTo(cx - s, eyeY - s);
        ctx.lineTo(cx + s, eyeY + s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s, eyeY + s);
        ctx.lineTo(cx + s, eyeY - s);
        ctx.stroke();
      }
    } else {
      const phase = (time + this.blinkOffset) % BLINK_CYCLE;
      const blinking = phase < BLINK_DURATION;
      if (blinking) {
        ctx.lineWidth = Math.max(2, rx * 0.08);
        for (const dir of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(dir * eyeDX, eyeY, eyeRadius, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();
        }
      } else {
        for (const dir of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(dir * eyeDX, eyeY, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const noseY = eyeY + ry * 0.28;
    ctx.fillStyle = COLORS.catEarInner;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.09, noseY);
    ctx.lineTo(rx * 0.09, noseY);
    ctx.lineTo(0, noseY + ry * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = COLORS.catFeature;
    ctx.lineWidth = Math.max(1.5, rx * 0.05);
    const mouthY = noseY + ry * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, mouthY);
    ctx.quadraticCurveTo(rx * 0.18, mouthY + ry * 0.14, rx * 0.32, mouthY);
    ctx.moveTo(0, mouthY);
    ctx.quadraticCurveTo(-rx * 0.18, mouthY + ry * 0.14, -rx * 0.32, mouthY);
    ctx.stroke();
  }
}
