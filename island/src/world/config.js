/** 软陶海岛色板与布局常量（灵感来自 xiaodao-island 的粘土质感，配色与造型原创）。 */

export const PALETTE = {
  sand: '#f1dfb6',
  sandWet: '#e3cd9c',
  grass: '#a7cf96',
  upper: '#97c387',
  path: '#efe2c4',
  rock: '#c9c0aa',
  trunk: '#8a6a4a',
  tree: ['#5f9a6a', '#7db57a', '#4f8a64', '#f0b8b0'],
  conifer: ['#3f7a5a', '#4f8a5f', '#5b9468'],
  wood: '#b58a5e',
  woodDark: '#8a6845',
  wall: '#fbf5e8',
  roofRed: '#d65a4a',
  roofBlue: '#3f88a6',
  roofYellow: '#e9b350',
  lhWhite: '#fbf5e8',
  lhRed: '#d65a4a',
  glass: '#4f6d70',
  glow: '#ffcf87',
  cloud: '#ffffff',
  seaShallow: '#35d2cb',
  seaMid: '#17a3c8',
  seaDeep: '#1c5fbf',
  foam: '#ffffff',
  seabed: '#ead6a5',
  canopy: '#fffdf6',
  cloth: ['#d65a4a', '#3f88a6', '#e9b350', '#5aa58c', '#f0b8b0'],
  coral: ['#c98a7c', '#9c8fbf', '#f08a4b'],
  fish: ['#4f7484', '#e9b350', '#d65a4a', '#35d2cb'],
  bird: '#f4efe6',
  skin: '#f0d2b0',
  shirt: ['#3f88a6', '#d65a4a', '#5aa58c', '#e9b350'],
};

export const ISLAND_RADIUS = 30;
export const LEVEL = { sand: 0.9, grass: 2.0, upper: 4.6 };
export const UPPER = { s: 0.42, cx: -6, cz: -6 };
export const SEA_LEVEL = 0.35;

export const VIEWS = {
  all: { look: [3, 3, 8], dist: 145, az: 0.62, tilt: 0.58 },
  harbor: { look: [0, 2.2, 28], dist: 58, az: 0.15, tilt: 0.42 },
  market: { look: [-19, 2.2, 21], dist: 36, az: -0.55, tilt: 0.48 },
  cape: { look: [24, 5, 2], dist: 48, az: 1.35, tilt: 0.32 },
  peak: { look: [-8, 8, -8], dist: 42, az: -0.55, tilt: 0.55 },
};

export const INTRO_FROM = { look: [0, 4, 0], dist: 220, az: -0.4, tilt: 1.12 };

export const RENDER = {
  pixelRatioDesktop: 1.6,
  pixelRatioMobile: 1.25,
  shadowMapDesktop: 2048,
  shadowMapMobile: 1024,
};
