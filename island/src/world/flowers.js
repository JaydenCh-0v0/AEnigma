import * as THREE from 'three';
import { put } from './geo.js';

/**
 * 软陶花圃几何（参考 low-poly / lathe petal / Formogenesis 花科剪影）
 * - 雏菊：放射瓣 + 黄心
 * - 郁金香：杯状叠瓣
 * - 虞美人：宽瓣 + 深心
 * - 风铃草：垂铃
 * - 向日葵：长瓣 + 褐盘
 * - 三叶草：三瓣叶 + 粉球
 * - 鼠尾草穗：竖向小花团
 */

const FLAT = { flatShading: true };
const STEM = '#4f8a64';
const LEAF = '#5f9a6a';
const CALYX = '#3f7a5a';

const GEO = {
  stem: new THREE.CylinderGeometry(0.028, 0.04, 1, 5),
  petal: new THREE.SphereGeometry(0.16, 8, 6),
  disc: new THREE.SphereGeometry(0.12, 9, 7),
  leaf: new THREE.SphereGeometry(0.16, 8, 6),
  bell: new THREE.ConeGeometry(0.18, 0.32, 7),
  spike: new THREE.SphereGeometry(0.08, 7, 5),
};

function stem(mats, g, h, phase = 0, sway = true) {
  const s = put(g, GEO.stem, mats.get(STEM), 0, h * 0.5, 0, { cast: false });
  s.scale.set(1, h, 1);
  if (sway) g.userData.sway = { phase, amp: 0.05 + (phase % 1) * 0.05 };
  return s;
}

function leafPair(mats, g, y, spread = 0.12) {
  const l = put(g, GEO.leaf, mats.get(LEAF), -spread, y, 0.02, { cast: false });
  l.scale.set(0.55, 0.22, 0.9);
  l.rotation.z = 0.55;
  const r = put(g, GEO.leaf, mats.get(LEAF), spread, y, -0.02, { cast: false });
  r.scale.set(0.55, 0.22, 0.9);
  r.rotation.z = -0.55;
}

/** 雏菊 / 小白菊 */
function daisy(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.42 + rnd() * 0.22;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.35, 0.14);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  const n = 8 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = put(
      g,
      GEO.petal,
      mats.get(petal, FLAT),
      Math.cos(a) * 0.16,
      h + 0.03,
      Math.sin(a) * 0.16,
      { cast: false },
    );
    p.scale.set(0.7, 0.28, 1.15);
    p.lookAt(Math.cos(a) * 2, h, Math.sin(a) * 2);
    p.rotateX(0.35);
  }
  put(g, GEO.disc, mats.get(colors.center), 0, h + 0.06, 0, { cast: false }).scale.setScalar(1.05);
  return g;
}

/** 郁金香：杯状 */
function tulip(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.45 + rnd() * 0.25;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.4, 0.14);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const p = put(
      g,
      GEO.petal,
      mats.get(petal, FLAT),
      Math.cos(a) * 0.09,
      h + 0.1,
      Math.sin(a) * 0.09,
      { cast: false },
    );
    p.scale.set(0.85, 1.35, 0.55);
    p.lookAt(0, h + 0.55, 0);
    p.rotateX(-0.55);
  }
  put(g, GEO.disc, mats.get(CALYX), 0, h - 0.02, 0, { cast: false }).scale.set(0.55, 0.35, 0.55);
  return g;
}

/** 虞美人 / 罂粟宽瓣 */
function poppy(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.42 + rnd() * 0.2;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.3, 0.12);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const p = put(
      g,
      GEO.petal,
      mats.get(petal, FLAT),
      Math.cos(a) * 0.12,
      h + 0.06,
      Math.sin(a) * 0.12,
      { cast: false },
    );
    p.scale.set(1.35, 0.4, 1.15);
    p.lookAt(Math.cos(a), h + 0.25, Math.sin(a));
    p.rotateX(0.15);
  }
  put(g, GEO.disc, mats.get('#2a2420'), 0, h + 0.06, 0, { cast: false }).scale.setScalar(0.55);
  put(g, GEO.spike, mats.get('#e9b350'), 0, h + 0.1, 0, { cast: false }).scale.setScalar(0.7);
  return g;
}

/** 风铃草：垂铃 */
function bellflower(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.5 + rnd() * 0.28;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.45, 0.1);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  const bell = put(g, GEO.bell, mats.get(petal, FLAT), 0, h + 0.02, 0.04, { cast: false });
  bell.rotation.x = Math.PI * 0.82;
  bell.scale.set(1.1, 1.2, 1.1);
  put(g, GEO.spike, mats.get('#fffaf0'), 0, h - 0.02, 0.06, { cast: false }).scale.setScalar(0.6);
  return g;
}

/** 小向日葵 */
function sunflower(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.55 + rnd() * 0.3;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.4, 0.16);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = put(
      g,
      GEO.petal,
      mats.get(petal, FLAT),
      Math.cos(a) * 0.2,
      h + 0.05,
      Math.sin(a) * 0.2,
      { cast: false },
    );
    p.scale.set(0.55, 0.22, 1.35);
    p.lookAt(Math.cos(a) * 2, h, Math.sin(a) * 2);
    p.rotateX(0.25);
  }
  put(g, GEO.disc, mats.get('#6e5438'), 0, h + 0.06, 0, { cast: false }).scale.set(1.35, 0.6, 1.35);
  put(g, GEO.spike, mats.get('#3f3428'), 0, h + 0.09, 0, { cast: false }).scale.setScalar(1.1);
  return g;
}

/** 三叶草 */
function clover(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.22 + rnd() * 0.12;
  stem(mats, g, h, rnd() * 10);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leaf = put(
      g,
      GEO.leaf,
      mats.get(LEAF, FLAT),
      Math.cos(a) * 0.08,
      h + 0.02,
      Math.sin(a) * 0.08,
      { cast: false },
    );
    leaf.scale.set(0.7, 0.28, 0.85);
    leaf.lookAt(Math.cos(a), h + 0.2, Math.sin(a));
  }
  if (rnd() > 0.45) {
    const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
    put(g, GEO.spike, mats.get(petal), 0, h + 0.1, 0, { cast: false }).scale.setScalar(1.2);
  }
  return g;
}

/** 鼠尾草 / 薰衣草穗 */
function spike(mats, rnd, colors) {
  const g = new THREE.Group();
  const h = 0.48 + rnd() * 0.28;
  stem(mats, g, h, rnd() * 10);
  leafPair(mats, g, h * 0.35, 0.11);
  const petal = colors.petal[Math.floor(rnd() * colors.petal.length)];
  const layers = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < layers; i++) {
    const y = h * 0.55 + i * 0.055;
    const ring = 3 + (i % 2);
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2 + i * 0.4;
      const p = put(
        g,
        GEO.spike,
        mats.get(petal, FLAT),
        Math.cos(a) * 0.04,
        y,
        Math.sin(a) * 0.04,
        { cast: false },
      );
      p.scale.setScalar(0.7 + rnd() * 0.35);
    }
  }
  return g;
}

const KINDS = [
  { name: 'daisy', build: daisy, weight: 22 },
  { name: 'tulip', build: tulip, weight: 16 },
  { name: 'poppy', build: poppy, weight: 14 },
  { name: 'bell', build: bellflower, weight: 12 },
  { name: 'sunflower', build: sunflower, weight: 10 },
  { name: 'clover', build: clover, weight: 14 },
  { name: 'spike', build: spike, weight: 12 },
];

const PALETTES = {
  daisy: { petal: ['#fffaf0', '#f7f2ea', '#f0b8b0'], center: '#e9b350' },
  tulip: { petal: ['#d65a4a', '#e9b350', '#f0b8b0', '#9c8fbf'] },
  poppy: { petal: ['#d65a4a', '#e07050', '#c44536'] },
  bell: { petal: ['#9c8fbf', '#7a8fd4', '#b58ad6'] },
  sunflower: { petal: ['#e9b350', '#f0c35a', '#d4a03a'] },
  clover: { petal: ['#f0b8b0', '#fffaf0', '#d65a4a'] },
  spike: { petal: ['#9c8fbf', '#7a6aad', '#b58ad6', '#f0b8b0'] },
};

function pickKind(rnd) {
  const total = KINDS.reduce((s, k) => s + k.weight, 0);
  let t = rnd() * total;
  for (const k of KINDS) {
    t -= k.weight;
    if (t <= 0) return k;
  }
  return KINDS[0];
}

/** 生成一株软陶花（世界坐标由调用方设置）。 */
export function makeFlower(mats, rnd) {
  const kind = pickKind(rnd);
  const flower = kind.build(mats, rnd, PALETTES[kind.name]);
  flower.userData.flowerKind = kind.name;
  flower.rotation.y = rnd() * Math.PI * 2;
  // 贴近花园尺度：多数 ~0.4–0.7 m，向日葵略高仍可读
  const s = 0.95 + rnd() * 0.45;
  flower.scale.setScalar(s);
  return flower;
}

export const FLOWER_KINDS = KINDS.map((k) => k.name);

/** 指定种类生成一株花（图鉴用）。 */
export function makeFlowerKind(mats, kindName, rnd = Math.random) {
  const kind = KINDS.find((k) => k.name === kindName) || KINDS[0];
  const flower = kind.build(mats, rnd, PALETTES[kind.name]);
  flower.userData.flowerKind = kind.name;
  flower.rotation.y = rnd() * Math.PI * 2;
  flower.scale.setScalar(1.15);
  return flower;
}
