export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 960;
export const WATER_HEIGHT = 90;

export const COLORS = {
  skyTop: '#bfe6ff',
  skyBottom: '#d9f1ff',
  cloud: 'rgba(255, 255, 255, 0.85)',
  water: '#4fc3f7',
  waterHighlight: '#81d4fa',
  waterFoam: 'rgba(255, 255, 255, 0.55)',
  platform: '#ffcc80',
  platformEdge: '#ffa726',
  eggShell: '#ffffff',
  eggShellShadow: '#ffe0b2',
  eggFeature: '#e53935',
  drawn: '#1a1a1a',
};

export const LEVELS = [
  {
    name: 'Cracked Beginnings',
    platforms: [
      { x: 270, y: 640, width: 480, height: 30, angle: 0 },
    ],
    eggs: [
      { x: 110, y: 560, width: 100, height: 130 },
      { x: 430, y: 560, width: 100, height: 130 },
    ],
  },
  {
    // A zigzag staircase of slanted ramps. A round body can't rest in static
    // equilibrium on any frictional incline (gravity always induces rolling
    // torque about the contact point) - so each egg sits pinned against a
    // small stopper peg partway down its ramp, leaving open ramp beyond the
    // peg for the dropped object to keep rolling after cracking the egg.
    name: 'Slippery Slopes',
    platforms: [
      { x: 170, y: 260, width: 280, height: 24, angle: 12 },
      { x: 250.1, y: 253.5, isStopper: true, width: 14, height: 22, angle: 12 },
      { x: 360, y: 440, width: 280, height: 24, angle: -12 },
      { x: 279.9, y: 433.5, isStopper: true, width: 14, height: 22, angle: -12 },
      { x: 170, y: 620, width: 280, height: 24, angle: 12 },
      { x: 250.1, y: 613.5, isStopper: true, width: 14, height: 22, angle: 12 },
    ],
    eggs: [
      { x: 196.7, y: 194.6, width: 100, height: 130 },
      { x: 333.3, y: 374.6, width: 100, height: 130 },
      { x: 196.7, y: 554.6, width: 100, height: 130 },
    ],
  },
  {
    // Four-step zigzag staircase - same stopper-peg trick as level 2, just
    // one more step and a gentler slope.
    name: 'Double Trouble',
    platforms: [
      { x: 170, y: 190, width: 280, height: 24, angle: 11 },
      { x: 250.0, y: 182.1, isStopper: true, width: 14, height: 22, angle: 11 },
      { x: 370, y: 360, width: 280, height: 24, angle: -11 },
      { x: 290.0, y: 352.1, isStopper: true, width: 14, height: 22, angle: -11 },
      { x: 170, y: 530, width: 280, height: 24, angle: 11 },
      { x: 250.0, y: 522.1, isStopper: true, width: 14, height: 22, angle: 11 },
      { x: 370, y: 700, width: 280, height: 24, angle: -11 },
      { x: 290.0, y: 692.1, isStopper: true, width: 14, height: 22, angle: -11 },
    ],
    eggs: [
      { x: 195.5, y: 124.2, width: 100, height: 130 },
      { x: 344.5, y: 294.2, width: 100, height: 130 },
      { x: 195.5, y: 464.2, width: 100, height: 130 },
      { x: 344.5, y: 634.2, width: 100, height: 130 },
    ],
  },
  {
    // A shallow sloped cave floor with a partial ceiling: the ceiling blocks
    // a straight drop onto the far two eggs, so the object has to enter from
    // the open left side and roll under the overhang to reach them.
    name: 'Under the Cliffs',
    platforms: [
      { x: 270, y: 680, width: 520, height: 24, angle: 8 },
      { x: 385, y: 505, width: 230, height: 24, angle: 0 },
      { x: 302.9, y: 661.4, isStopper: true, width: 14, height: 22, angle: 8 },
      { x: 372.2, y: 671.1, isStopper: true, width: 14, height: 22, angle: 8 },
      { x: 441.5, y: 680.9, isStopper: true, width: 14, height: 22, angle: 8 },
    ],
    eggs: [
      { x: 245.5, y: 606.4, width: 100, height: 130 },
      { x: 314.8, y: 616.1, width: 100, height: 130 },
      { x: 384.1, y: 625.9, width: 100, height: 130 },
    ],
  },
  {
    // Five-step zigzag, steeper and narrower than level 3 - the long chain
    // reaction from this batch.
    name: 'Long Way Down',
    platforms: [
      { x: 170, y: 150, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 143.7, isStopper: true, width: 14, height: 22, angle: 13 },
      { x: 370, y: 290, width: 260, height: 24, angle: -13 },
      { x: 295.2, y: 283.7, isStopper: true, width: 14, height: 22, angle: -13 },
      { x: 170, y: 430, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 423.7, isStopper: true, width: 14, height: 22, angle: 13 },
      { x: 370, y: 570, width: 260, height: 24, angle: -13 },
      { x: 295.2, y: 563.7, isStopper: true, width: 14, height: 22, angle: -13 },
      { x: 170, y: 710, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 703.7, isStopper: true, width: 14, height: 22, angle: 13 },
    ],
    eggs: [
      { x: 192.5, y: 83.9, width: 100, height: 130 },
      { x: 347.5, y: 223.9, width: 100, height: 130 },
      { x: 192.5, y: 363.9, width: 100, height: 130 },
      { x: 347.5, y: 503.9, width: 100, height: 130 },
      { x: 192.5, y: 643.9, width: 100, height: 130 },
    ],
  },
  {
    // Two real pendulum platforms (a genuine Matter constraint, not scripted
    // motion - see physics.js addSwingPlatform for why). They stay level (no
    // slope, so no stopper is needed to pin the eggs) but swing once the
    // timer starts - this one is about timing the drop, not just aim.
    name: 'Pendulum Point',
    swings: [
      { pivotX: 150, pivotY: 150, x: 253.2, y: 297.5, width: 140, height: 22 },
      { pivotX: 320, pivotY: 420, x: 405.0, y: 567.2, width: 140, height: 22 },
    ],
    eggs: [
      { x: 253.2, y: 228.9, width: 100, height: 130 },
      { x: 405.0, y: 498.7, width: 100, height: 130 },
    ],
  },
  {
    // The finale of this batch: flat start, a slanted ramp, a swinging
    // platform, and a flat landing - one of each mechanic from levels 1-6.
    name: 'The Gauntlet',
    platforms: [
      { x: 150, y: 200, width: 200, height: 24, angle: 0 },
      { x: 350, y: 380, width: 260, height: 24, angle: -12 },
      { x: 243.0, y: 379.2, isStopper: true, width: 14, height: 22, angle: -12 },
      { x: 180, y: 700, width: 220, height: 24, angle: 0 },
    ],
    swings: [
      { pivotX: 60, pivotY: 426, x: 130.4, y: 558.4, width: 140, height: 22 },
    ],
    eggs: [
      { x: 150, y: 130.5, width: 100, height: 130 },
      { x: 296.4, y: 320.3, width: 100, height: 130 },
      { x: 130.4, y: 489.9, width: 100, height: 130 },
      { x: 180, y: 630.5, width: 100, height: 130 },
    ],
  },
];

export function parseLevel(levelData) {
  return {
    name: levelData.name,
    platforms: (levelData.platforms || []).map((p) => ({ ...p })),
    eggs: levelData.eggs.map((e) => ({ ...e })),
    swings: (levelData.swings || []).map((s) => ({ ...s })),
  };
}
