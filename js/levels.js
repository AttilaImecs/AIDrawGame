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
];

export function parseLevel(levelData) {
  return {
    name: levelData.name,
    platforms: levelData.platforms.map((p) => ({ ...p })),
    eggs: levelData.eggs.map((e) => ({ ...e })),
  };
}
