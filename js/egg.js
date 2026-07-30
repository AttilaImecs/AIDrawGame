import { COLORS } from './levels.js';

const BLINK_CYCLE = 3.2;
const BLINK_DURATION = 0.15;
const SHARD_COUNT = 14;
const SHARD_LIFETIME = 0.8;
const SHARD_GRAVITY = 400;

export class BadEgg {
  constructor(config, body) {
    this.width = config.width;
    this.height = config.height;
    this.body = body;
    this.cracked = false;
    this.crackTimer = 0;
    this.shards = [];
    // Stagger blink timing per egg so multiple eggs don't blink in unison.
    this.blinkOffset = Math.random() * BLINK_CYCLE;
  }

  get x() {
    return this.body.position.x;
  }

  get y() {
    return this.body.position.y;
  }

  crack() {
    if (this.cracked) return;
    this.cracked = true;
    this.crackTimer = 0;
    const cx = this.x;
    const cy = this.y;
    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / SHARD_COUNT + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 140;
      this.shards.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        age: 0,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  update(dt) {
    if (!this.cracked) return;
    this.crackTimer += dt;
    for (const s of this.shards) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += SHARD_GRAVITY * dt;
      s.rot += s.vr * dt;
    }
    this.shards = this.shards.filter((s) => s.age < SHARD_LIFETIME);
  }

  isFinished() {
    return this.cracked && this.crackTimer > SHARD_LIFETIME;
  }

  draw(ctx, time) {
    if (this.cracked) {
      this._drawShards(ctx);
      return;
    }

    const rx = this.width / 2;
    const ry = this.height / 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.body.angle);

    ctx.fillStyle = COLORS.eggShell;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.28;
    ctx.fillStyle = COLORS.eggShellShadow;
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.55, rx * 0.55, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const phase = (time + this.blinkOffset) % BLINK_CYCLE;
    const blinking = phase < BLINK_DURATION;
    const eyeDX = rx * 0.32;
    const eyeY = 0;
    const eyeRadius = rx * 0.11;
    // All offsets below are proportional to eyeDX/rx/ry (not fixed pixels) so
    // the face keeps its proportions at any egg size instead of the brows
    // crossing over each other on small eggs or looking too close on big ones.
    const browLineWidth = Math.max(2, rx * 0.09);
    const eyeLineWidth = Math.max(2, rx * 0.07);

    ctx.strokeStyle = COLORS.eggFeature;
    ctx.fillStyle = COLORS.eggFeature;
    ctx.lineCap = 'round';

    if (blinking) {
      ctx.lineWidth = eyeLineWidth;
      const halfWidth = eyeRadius * 1.3;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * eyeDX - halfWidth, eyeY);
        ctx.lineTo(dir * eyeDX + halfWidth, eyeY);
        ctx.stroke();
      }
    } else {
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(dir * eyeDX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Angry eyebrows: inner end near the nose sits low and close, outer end
    // sweeps up and further out. Kept a clear gap above the eyes so the two
    // features always read separately, at any egg size.
    ctx.lineWidth = browLineWidth;
    const browInnerX = eyeDX * 0.45;
    const browOuterX = eyeDX * 1.75;
    const browInnerY = eyeY - ry * 0.22;
    const browOuterY = eyeY - ry * 0.38;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * browInnerX, browInnerY);
      ctx.lineTo(dir * browOuterX, browOuterY);
      ctx.stroke();
    }

    // Evil smile
    ctx.beginPath();
    ctx.arc(0, ry * 0.3, rx * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  _drawShards(ctx) {
    for (const s of this.shards) {
      const t = s.age / SHARD_LIFETIME;
      const alpha = Math.max(0, 1 - t);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = COLORS.eggShell;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(6, -2);
      ctx.lineTo(3, 6);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
