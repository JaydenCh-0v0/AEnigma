import * as THREE from 'three';
import { ISLAND_RADIUS, LEVEL, PALETTE as P, UPPER } from './config.js';
import { put } from './geo.js';
import { noise3, seeded, wrapAngle } from '../utils/math.js';

const MAIN = { cx: 0, cz: 0, s: 1, k: 0 };
const SATELLITES = [
  { cx: 56, cz: 26, s: 0.2, k: 1.3 },
  { cx: -50, cz: 30, s: 0.19, k: 2.4 },
];
const PENINSULA = { th: 2.0, amp: 0.55, width: 0.1 };
export const MAIN_PEAK = { x: -11, z: -12, rx: 8.5, ry: 10, rz: 7.5 };
const PEAK_FLAT = 0.97;
export const PEAK_TOP = LEVEL.upper + MAIN_PEAK.ry * PEAK_FLAT;

const BANDS = [
  [0.0, '#86b07c'],
  [0.2, '#7fa577'],
  [0.38, '#97a48a'],
  [0.58, '#a8a597'],
  [0.8, '#bdb8aa'],
  [1.0, '#cfcabd'],
];

/** 极坐标轮廓：正弦叠层做出不规则海岸。 */
export function rad(th, s, k = 0) {
  let r =
    1 +
    0.09 * Math.sin(3 * th + 0.6 + k) +
    0.05 * Math.sin(5 * th + 2.1 + k) +
    0.03 * Math.sin(9 * th + 0.3);
  if (k === 0) {
    r += 0.2 * Math.exp(-(wrapAngle(th) ** 2) / 0.018);
    r -= 0.12 * Math.exp(-(wrapAngle(th - Math.PI / 2) ** 2) / 0.04);
    if (s >= 0.8) {
      r += PENINSULA.amp * Math.exp(-(wrapAngle(th - PENINSULA.th) ** 2) / PENINSULA.width);
    }
  }
  return ISLAND_RADIUS * s * r;
}

export function inside(x, z, s, cx = 0, cz = 0, margin = 0, k = 0) {
  const dx = x - cx;
  const dz = z - cz;
  return Math.hypot(dx, dz) < rad(Math.atan2(dz, dx), s, k) - margin;
}

export function groundY(x, z) {
  if (inside(x, z, UPPER.s, UPPER.cx, UPPER.cz, 0.6)) return LEVEL.upper;
  if (inside(x, z, 0.84, 0, 0, 0.6)) return LEVEL.grass;
  if (inside(x, z, 1, 0, 0, 0.4)) return LEVEL.sand;
  for (const isle of SATELLITES) {
    if (inside(x, z, isle.s * 0.78, isle.cx, isle.cz, 0.2, isle.k)) return 1.7;
    if (inside(x, z, isle.s, isle.cx, isle.cz, 0.2, isle.k)) return 0.8;
  }
  return -1;
}

/** 有符号离岸距离，海面着色器用浅滩与白浪。 */
export function shoreDistance(x, z) {
  let best = Infinity;
  for (const isle of [MAIN, ...SATELLITES]) {
    const dx = x - isle.cx;
    const dz = z - isle.cz;
    best = Math.min(best, Math.hypot(dx, dz) - rad(Math.atan2(dz, dx), isle.s, isle.k));
  }
  return best;
}

function slab(mats, parent, isle, scale, top, depth, color) {
  const n = 140;
  const shape = new THREE.Shape();
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const r = rad(th, isle.s * scale, isle.k);
    const x = isle.cx + r * Math.cos(th);
    const z = isle.cz + r * Math.sin(th);
    if (i) shape.lineTo(x, -z);
    else shape.moveTo(x, -z);
  }
  const bevel = 0.55;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.75,
    bevelSegments: 4,
  });
  g.rotateX(-Math.PI / 2);
  return put(parent, g, mats.get(color), 0, top - depth - bevel, 0, { cast: false });
}

function bandColor(h, out, tmp) {
  for (let i = 1; i < BANDS.length; i++) {
    if (h <= BANDS[i][0]) {
      const [h0, c0] = BANDS[i - 1];
      const [h1, c1] = BANDS[i];
      return out.set(c0).lerp(tmp.set(c1), (h - h0) / (h1 - h0));
    }
  }
  return out.set(BANDS[BANDS.length - 1][1]);
}

function peakGeometry(rx, ry, rz, seed, flatTop) {
  const g = new THREE.IcosahedronGeometry(1, 4);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const tmp = new THREE.Color();
  const rnd = seeded(seed);
  const jitter = new Map();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const ridge = (1 - Math.abs(noise3(vx * 2.2 + seed, vy * 2.2, vz * 2.2))) ** 2;
    const r =
      1 +
      noise3(vx * 1.6 + seed, vy * 1.6, vz * 1.6) * 0.22 +
      noise3(vx * 3.4, vy * 3.4 + seed, vz * 3.4) * 0.1 +
      ridge * 0.12;
    let y = vy < 0 ? vy * ry * 0.12 : vy * r * ry;
    y = Math.min(y, ry * flatTop);
    pos.setXYZ(i, vx * r * rx, y, vz * r * rz);

    const key = `${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}`;
    if (!jitter.has(key)) jitter.set(key, (rnd() - 0.5) * 0.08);
    bandColor(Math.max(0, y / ry - (1 - Math.abs(vy)) * 0.1), c, tmp).offsetHSL(0, 0, jitter.get(key));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }

  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function buildMountains(mats, parent) {
  const peaks = [
    [MAIN_PEAK.x, MAIN_PEAK.z, MAIN_PEAK.rx, MAIN_PEAK.ry, MAIN_PEAK.rz, 3.1, PEAK_FLAT],
    [-4, -15, 6, 7, 5.5, 7.7, Infinity],
    [-15.5, -5, 5.5, 5.5, 5, 11.3, Infinity],
    [-7.5, -8.5, 4, 3.2, 3.6, 5.9, Infinity],
  ];
  for (const [x, z, rx, ry, rz, seed, flat] of peaks) {
    put(parent, peakGeometry(rx, ry, rz, seed, flat), mats.rock, x, LEVEL.upper - 0.05, z);
  }
}

function rocks(mats, parent) {
  const rnd = seeded(772);
  const g = new THREE.SphereGeometry(1, 12, 9);
  for (let i = 0; i < 22; i++) {
    const th = rnd() * Math.PI * 2;
    if (Math.abs(wrapAngle(th - Math.PI / 2)) < 0.38 || Math.abs(wrapAngle(th)) < 0.12) continue;
    const r = rad(th, 1.02);
    const s = 0.35 + rnd() * 0.45;
    const m = put(parent, g, mats.get(P.rock), Math.cos(th) * r, 0.22, Math.sin(th) * r);
    m.scale.set(s * (1 + rnd() * 0.4), s * 0.65, s);
    m.rotation.set(rnd(), rnd() * 6, rnd());
  }
}

function stairs(mats, parent) {
  const dir = Math.PI / 4;
  const reach = 3.2;
  const overlap = 0.4;
  const halfWidth = 1.5;
  const steps = 9;
  const run = (reach + overlap) / steps;
  const re = rad(dir, UPPER.s);
  const dx = Math.cos(dir);
  const dz = Math.sin(dir);
  for (let i = 0; i < steps; i++) {
    const d = re + reach - (i + 0.5) * run;
    const top = LEVEL.grass + ((i + 1) / steps) * (LEVEL.upper - LEVEL.grass);
    const h = top - LEVEL.grass + 0.1;
    const m = put(
      parent,
      new THREE.BoxGeometry(halfWidth * 2, h, run + 0.02),
      mats.get(P.path),
      UPPER.cx + dx * d,
      top - h / 2,
      UPPER.cz + dz * d,
    );
    m.rotation.y = Math.atan2(dx, dz);
  }
}

function pathRibbon(mats, parent) {
  const pts = [
    new THREE.Vector3(0, LEVEL.sand + 0.03, 24),
    new THREE.Vector3(2, LEVEL.grass + 0.03, 12),
    new THREE.Vector3(6, LEVEL.grass + 0.03, 4),
    new THREE.Vector3(10, LEVEL.grass + 0.03, -2),
    new THREE.Vector3(18, LEVEL.sand + 0.03, 1),
    new THREE.Vector3(24, LEVEL.sand + 0.03, 2),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 64, 0.55, 8, false);
  put(parent, geo, mats.get(P.path), 0, 0, 0, { cast: false });
}

export function buildTerrain(mats, parent) {
  slab(mats, parent, MAIN, 1, LEVEL.sand, 1.4, P.sand);
  slab(mats, parent, MAIN, 0.84, LEVEL.grass, 1.4, P.grass);
  slab(mats, parent, { cx: UPPER.cx, cz: UPPER.cz, s: UPPER.s, k: 0 }, 1, LEVEL.upper, 2.6, P.upper);

  for (const isle of SATELLITES) {
    slab(mats, parent, isle, 1, 0.8, 1.2, P.sand);
    slab(mats, parent, isle, 0.78, 1.7, 1.2, P.grass);
  }

  buildMountains(mats, parent);
  rocks(mats, parent);
  stairs(mats, parent);
  pathRibbon(mats, parent);
}
