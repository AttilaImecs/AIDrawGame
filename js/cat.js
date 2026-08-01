import { COLORS } from './levels.js';

const BLINK_CYCLE = 3.4;
const BLINK_DURATION = 0.15;
// How long game.js waits after a kill before flipping to the fail screen -
// long enough for the blood burst to read as a real reaction to what happened.
export const CAT_FAIL_DELAY = 0.5;

const BLOOD_COUNT = 12;
const BLOOD_LIFETIME = 0.9;
const BLOOD_GRAVITY = 480;

export class Cat {
  constructor(config, body) {
    this.width = config.width;
    this.height = config.height;
    this.body = body;
    this.killed = false;
    this.killTimer = 0;
    this.blood = [];
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
    const cx = this.x;
    const cy = this.y;
    for (let i = 0; i < BLOOD_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / BLOOD_COUNT + (Math.random() - 0.5) * 0.6;
      const speed = 70 + Math.random() * 170;
      this.blood.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        age: 0,
        r: 2.5 + Math.random() * 3.5,
      });
    }
  }

  update(dt) {
    if (!this.killed) return;
    this.killTimer += dt;
    for (const b of this.blood) {
      b.age += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += BLOOD_GRAVITY * dt;
    }
    this.blood = this.blood.filter((b) => b.age < BLOOD_LIFETIME);
  }

  draw(ctx, time) {
    const rx = this.width / 2;
    const ry = this.height / 2;

    const bodyRx = rx * 1.05;
    const bodyRy = ry * 0.62;
    const bodyCy = ry * 0.38;
    const headRx = rx * 0.82;
    const headRy = ry * 0.52;
    const headCy = -ry * 0.42;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.body.angle);

    this._drawTail(ctx, bodyCy, bodyRx, bodyRy);
    this._drawBody(ctx, bodyCy, bodyRx, bodyRy);
    this._drawPaws(ctx, bodyCy, bodyRx, bodyRy);

    ctx.save();
    ctx.translate(0, headCy);
    this._drawEars(ctx, headRx, headRy);
    this._drawHead(ctx, headRx, headRy);
    this._drawWhiskers(ctx, headRx, headRy);
    this._drawFace(ctx, headRx, headRy, time);
    ctx.restore();

    ctx.restore();

    if (this.killed) this._drawBlood(ctx);
  }

  _drawTail(ctx, bodyCy, bx, by) {
    ctx.strokeStyle = COLORS.catFur;
    ctx.lineCap = 'round';
    ctx.lineWidth = bx * 0.34;
    const startX = bx * 0.7;
    const startY = bodyCy + by * 0.15;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + bx * 0.7, startY - by * 0.3, startX + bx * 0.85, startY - by * 1.5, startX + bx * 0.2, startY - by * 1.75);
    ctx.stroke();
  }

  _drawBody(ctx, cy, bx, by) {
    ctx.fillStyle = COLORS.catFur;
    ctx.beginPath();
    ctx.ellipse(0, cy, bx, by, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, cy + by * 0.3, bx * 0.42, by * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _drawPaws(ctx, bodyCy, bx, by) {
    ctx.fillStyle = COLORS.catFur;
    const pawY = bodyCy + by * 0.8;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * bx * 0.38, pawY, bx * 0.22, by * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawHead(ctx, rx, ry) {
    ctx.fillStyle = COLORS.catFur;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.4, rx * 0.5, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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
      // X eyes read as "startled", matching the blood - a clear "ouch", not
      // a peaceful expression.
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

  _drawBlood(ctx) {
    for (const b of this.blood) {
      const t = b.age / BLOOD_LIFETIME;
      const alpha = Math.max(0, 1 - t);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
