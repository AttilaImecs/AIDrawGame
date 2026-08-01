export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 1260;
export const WATER_HEIGHT = 90;
// Only the top third of the canvas is drawable - everything else (all
// platforms/eggs) lives in the bottom two-thirds so the player can't just
// draw directly on top of an egg.
export const DRAW_ZONE_HEIGHT = DESIGN_HEIGHT / 3;
// The size every level's eggs already use - a single source of truth for
// the level editor's fixed egg placement size, instead of a new duplicated
// magic number.
export const DEFAULT_EGG_WIDTH = 66.7;
export const DEFAULT_EGG_HEIGHT = 86.7;

export const COLORS = {
  skyTop: '#bfe6ff',
  skyBottom: '#d9f1ff',
  cloud: 'rgba(255, 255, 255, 0.85)',
  drawZone: 'rgba(255, 255, 255, 0.35)',
  drawZoneEdge: 'rgba(255, 255, 255, 0.7)',
  water: '#4fc3f7',
  waterHighlight: '#81d4fa',
  waterFoam: 'rgba(255, 255, 255, 0.55)',
  platform: '#ffcc80',
  platformEdge: '#ffa726',
  eggShell: '#ffffff',
  eggShellShadow: '#ffe0b2',
  eggFeature: '#e53935',
  catFur: '#b0aeb0',
  catEarInner: '#f8c9d4',
  catFeature: '#3e2723',
  drawn: '#1a1a1a',
};

export const LEVELS = [
  {
    name: 'Cracked Beginnings',
    platforms: [
      { x: 270, y: 563.4, width: 480, height: 30, angle: 0 },
    ],
    eggs: [
      { x: 110, y: 483.4, width: 66.7, height: 86.7 },
      { x: 430, y: 483.4, width: 66.7, height: 86.7 },
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
      { x: 170, y: 548.8, width: 280, height: 24, angle: 12 },
      { x: 250.1, y: 542.2, isStopper: true, width: 14, height: 22, angle: 12 },
      { x: 360, y: 728.8, width: 280, height: 24, angle: -12 },
      { x: 279.9, y: 722.2, isStopper: true, width: 14, height: 22, angle: -12 },
      { x: 170, y: 908.8, width: 280, height: 24, angle: 12 },
      { x: 250.1, y: 902.2, isStopper: true, width: 14, height: 22, angle: 12 },
    ],
    eggs: [
      { x: 196.7, y: 483.4, width: 66.7, height: 86.7 },
      { x: 333.3, y: 663.4, width: 66.7, height: 86.7 },
      { x: 196.7, y: 843.4, width: 66.7, height: 86.7 },
    ],
  },
  {
    // Four-step zigzag staircase - same stopper-peg trick as level 2, just
    // one more step and a gentler slope.
    name: 'Double Trouble',
    platforms: [
      { x: 170, y: 549.1, width: 280, height: 24, angle: 11 },
      { x: 250.0, y: 541.2, isStopper: true, width: 14, height: 22, angle: 11 },
      { x: 370, y: 719.1, width: 280, height: 24, angle: -11 },
      { x: 290.0, y: 711.2, isStopper: true, width: 14, height: 22, angle: -11 },
      { x: 170, y: 889.1, width: 280, height: 24, angle: 11 },
      { x: 250.0, y: 881.2, isStopper: true, width: 14, height: 22, angle: 11 },
      { x: 370, y: 1059.2, width: 280, height: 24, angle: -11 },
      { x: 290.0, y: 1051.2, isStopper: true, width: 14, height: 22, angle: -11 },
    ],
    eggs: [
      { x: 195.5, y: 483.3, width: 66.7, height: 86.7 },
      { x: 344.5, y: 653.3, width: 66.7, height: 86.7 },
      { x: 195.5, y: 823.3, width: 66.7, height: 86.7 },
      { x: 344.5, y: 993.4, width: 66.7, height: 86.7 },
    ],
  },
  {
    // A real cave: one long sloped floor, tucked entirely under a rock
    // ceiling for its middle and right sections. The left end (egg 1) is
    // open to the sky; eggs 2 and 3 sit beneath the overhang, only reachable
    // by entering from the open left side and rolling downhill underneath it.
    name: 'Under the Cliffs',
    platforms: [
      { x: 275, y: 700, width: 500, height: 24, angle: 8 },
      { x: 355.3, y: 469.8, width: 280, height: 24, angle: 0 },
      { x: 149.8, y: 659.2, isStopper: true, width: 14, height: 22, angle: 8 },
      { x: 323.1, y: 683.5, isStopper: true, width: 14, height: 22, angle: 8 },
      { x: 496.4, y: 707.9, isStopper: true, width: 14, height: 22, angle: 8 },
    ],
    eggs: [
      { x: 108.7, y: 625.8, width: 66.7, height: 86.7 },
      { x: 282.0, y: 650.1, width: 66.7, height: 86.7 },
      { x: 455.3, y: 674.5, width: 66.7, height: 86.7 },
    ],
  },
  {
    // Five-step zigzag, steeper and narrower than level 3 - the long chain
    // reaction from this batch.
    name: 'Long Way Down',
    platforms: [
      { x: 170, y: 549.5, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 543.1, isStopper: true, width: 14, height: 22, angle: 13 },
      { x: 370, y: 689.5, width: 260, height: 24, angle: -13 },
      { x: 295.2, y: 683.1, isStopper: true, width: 14, height: 22, angle: -13 },
      { x: 170, y: 829.5, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 823.1, isStopper: true, width: 14, height: 22, angle: 13 },
      { x: 370, y: 969.5, width: 260, height: 24, angle: -13 },
      { x: 295.2, y: 963.2, isStopper: true, width: 14, height: 22, angle: -13 },
      { x: 170, y: 1109.5, width: 260, height: 24, angle: 13 },
      { x: 244.8, y: 1103.2, isStopper: true, width: 14, height: 22, angle: 13 },
    ],
    eggs: [
      { x: 192.5, y: 483.4, width: 66.7, height: 86.7 },
      { x: 347.5, y: 623.4, width: 66.7, height: 86.7 },
      { x: 192.5, y: 763.3, width: 66.7, height: 86.7 },
      { x: 347.5, y: 903.3, width: 66.7, height: 86.7 },
      { x: 192.5, y: 1043.3, width: 66.7, height: 86.7 },
    ],
  },
  {
    // Two real pendulum platforms (a genuine Matter constraint, not scripted
    // motion - see physics.js addSwingPlatform for why). They stay level (no
    // slope, so no stopper is needed to pin the eggs) but swing once the
    // timer starts - this one is about timing the drop, not just aim.
    name: 'Pendulum Point',
    swings: [
      { pivotX: 150, pivotY: 440.0, x: 253.2, y: 587.5, width: 140, height: 22 },
      { pivotX: 320, pivotY: 710.0, x: 405.0, y: 857.2, width: 140, height: 22 },
    ],
    eggs: [
      { x: 253.2, y: 518.9, width: 66.7, height: 86.7 },
      { x: 405.0, y: 788.7, width: 66.7, height: 86.7 },
    ],
  },
  {
    // The finale of this batch: flat start, a slanted ramp, a swinging
    // platform, and a flat landing - one of each mechanic from levels 1-6.
    name: 'The Gauntlet',
    platforms: [
      { x: 150, y: 552.9, width: 200, height: 24, angle: 0 },
      { x: 350, y: 732.9, width: 260, height: 24, angle: -12 },
      { x: 243.0, y: 732.0, isStopper: true, width: 14, height: 22, angle: -12 },
      { x: 180, y: 1052.8, width: 220, height: 24, angle: 0 },
    ],
    swings: [
      { pivotX: 60, pivotY: 778.9, x: 130.4, y: 911.2, width: 140, height: 22 },
    ],
    eggs: [
      { x: 150, y: 483.4, width: 66.7, height: 86.7 },
      { x: 296.4, y: 673.2, width: 66.7, height: 86.7 },
      { x: 130.4, y: 842.8, width: 66.7, height: 86.7 },
      { x: 207, y: 983.4, width: 66.7, height: 86.7 },
    ],
  },
];

export function parseLevel(levelData) {
  return {
    name: levelData.name,
    platforms: (levelData.platforms || []).map((p) => ({ ...p })),
    eggs: levelData.eggs.map((e) => ({ ...e })),
    cats: (levelData.cats || []).map((c) => ({ ...c })),
    swings: (levelData.swings || []).map((s) => ({ ...s })),
  };
}
