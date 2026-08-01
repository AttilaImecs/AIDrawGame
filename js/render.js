import { COLORS, DESIGN_WIDTH, DRAW_ZONE_HEIGHT, WATER_HEIGHT } from './levels.js';

export function createClouds() {
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

export function drawSky(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawClouds(ctx, clouds, time) {
  ctx.fillStyle = COLORS.cloud;
  for (const c of clouds) {
    const x = c.baseX + Math.sin(time * c.freq + c.phase) * c.amplitude;
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.size / 2, c.size * 0.32, 0, 0, Math.PI * 2);
    ctx.ellipse(x + c.size * 0.32, c.y + c.size * 0.06, c.size * 0.34, c.size * 0.24, 0, 0, Math.PI * 2);
    ctx.ellipse(x - c.size * 0.3, c.y + c.size * 0.08, c.size * 0.28, c.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawDrawZone(ctx, width) {
  ctx.fillStyle = COLORS.drawZone;
  ctx.fillRect(0, 0, width, DRAW_ZONE_HEIGHT);
  ctx.strokeStyle = COLORS.drawZoneEdge;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(0, DRAW_ZONE_HEIGHT);
  ctx.lineTo(width, DRAW_ZONE_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawPlatform(ctx, p) {
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

// `plankX`/`plankY` is the plank's current center - a live Matter body's
// position while playing, or the static rest position while editing (no
// physics running yet).
export function drawSwingArm(ctx, pivotX, pivotY, plankX, plankY, width, height) {
  ctx.strokeStyle = COLORS.platformEdge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(plankX, plankY);
  ctx.stroke();

  ctx.fillStyle = COLORS.platformEdge;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
  ctx.fill();

  drawPlatform(ctx, { x: plankX, y: plankY, width, height, angle: 0 });
}

export function drawWater(ctx, width, height, time) {
  const waterTop = height - WATER_HEIGHT;
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(0, waterTop, width, WATER_HEIGHT);

  ctx.strokeStyle = COLORS.waterHighlight;
  ctx.lineWidth = 4;
  for (let row = 0; row < 3; row++) {
    const y = waterTop + 18 + row * 22;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 12) {
      const wave = Math.sin(time * 2 + x * 0.05 + row) * 4;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.waterFoam;
  ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.1;
  ctx.fillRect(0, waterTop, width, 4);
  ctx.globalAlpha = 1;
}
