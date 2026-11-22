import * as THREE from 'three';
import { LEVEL, PALETTE as P } from './config.js';
import { put } from './geo.js';
import { groundY, inside } from './terrain.js';
import { seeded } from '../utils/math.js';

const FLAT = { flatShading: true };

function roundCrown(mats, g, c) {
  const ball = new THREE.SphereGeometry(1, 14, 10);
  const puffs = [
    [0, 2.0, 0, 1.15],
    [0.55, 1.6, 0.2, 0.8],
    [-0.45, 1.7, -0.25, 0.8],
  ];
  for (const [a, b, cc, s] of puffs) {
    put(g, ball, mats.get(c), a, b, cc).scale.setScalar(s);
  }
}

function oakCrown(mats, g, c, rnd) {
  const chunk = new THREE.DodecahedronGeometry(1, 0);
  const parts = [
    [0, 2.15, 0, 1.15],
    [0.65, 1.75, 0.15, 0.78],
    [-0.55, 1.8, -0.3, 0.82],
    [0.1, 2.75, -0.1, 0.7],
  ];
  for (const [a, b, cc, s] of parts) {
    const m = put(g, chunk, mats.get(c, FLAT), a, b, cc);
    m.scale.setScalar(s);
    m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  }
}

function pineCrown(mats, g, c) {
  const tiers = [
    [1.35, 1.5, 1.55],
    [1.05, 1.3, 2.35],
    [0.72, 1.1, 3.05],
  ];
  for (const [r, h, y] of tiers) {
    put(g, new THREE.ConeGeometry(r, h, 7), mats.get(c, FLAT), 0, y, 0);
  }
}

function tree(mats, parent, x, z, y, rnd, scale = 1, kind = 'round') {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale * (0.8 + rnd() * 0.45));
  g.rotation.y = rnd() * 6;
  parent.add(g);

  const conifer = kind === 'pine';
  const colors = conifer ? P.conifer : P.tree;
  const c = colors[Math.floor(rnd() * colors.length)];
  put(
    g,
    new THREE.CylinderGeometry(0.14, 0.22, conifer ? 1.0 : 1.3, 7),
    mats.get(P.trunk),
    0,
    conifer ? 0.5 : 0.65,
    0,
  );

  if (kind === 'round') roundCrown(mats, g, c);
  else if (kind === 'oak') oakCrown(mats, g, c, rnd);
  else pineCrown(mats, g, c);
}

function pickKind(y, r) {
  if (y >= LEVEL.upper) return r < 0.7 ? 'pine' : 'oak';
  return r < 0.42 ? 'round' : r < 0.78 ? 'oak' : 'pine';
}

const BLOCKS = [
  [24, 2, 4],
  [0, 30, 6],
  [-11, -12, 10],
  [8, 8, 4],
  [-20, 18, 5],
];

function blocked(x, z) {
  return BLOCKS.some(([bx, bz, r]) => Math.hypot(x - bx, z - bz) < r);
}

export function buildForest(mats, parent) {
  const rnd = seeded(331);
  let placed = 0;
  for (let i = 0; i < 900 && placed < 90; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 27;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = groundY(x, z);
    if (y < LEVEL.grass || !inside(x, z, 0.84, 0, 0, 1.6)) continue;
    if (blocked(x, z)) continue;
    tree(mats, parent, x, z, y, rnd, 1, pickKind(y, rnd()));
    placed++;
  }

  for (const [cx, cz] of [
    [56, 26],
    [-50, 30],
  ]) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6 + 0.5;
      tree(
        mats,
        parent,
        cx + Math.cos(a) * 3.6,
        cz + Math.sin(a) * 3.6,
        1.7,
        rnd,
        0.8,
        i % 2 ? 'oak' : 'round',
      );
    }
  }
}

export function buildMeadow(mats, parent) {
  const rnd = seeded(901);
  const flowerColors = ['#d65a4a', '#e9b350', '#f0b8b0', '#b58ad6', '#fffaf0'];
  const stem = new THREE.CylinderGeometry(0.02, 0.03, 0.35, 5);
  const bloom = new THREE.SphereGeometry(0.12, 8, 6);
  const bush = new THREE.DodecahedronGeometry(0.55, 0);

  for (let i = 0; i < 180; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 8 + Math.sqrt(rnd()) * 16;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = groundY(x, z);
    if (y < LEVEL.grass || y >= LEVEL.upper) continue;
    if (blocked(x, z)) continue;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    put(g, stem, mats.get('#4f8a64'), 0, 0.18, 0, { cast: false });
    put(g, bloom, mats.get(flowerColors[Math.floor(rnd() * flowerColors.length)]), 0, 0.4, 0, {
      cast: false,
    }).scale.setScalar(0.7 + rnd() * 0.5);
    parent.add(g);
  }

  // 灌木丛
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 10 + Math.sqrt(rnd()) * 14;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = groundY(x, z);
    if (y < LEVEL.grass || blocked(x, z)) continue;
    const m = put(
      parent,
      bush,
      mats.get(P.tree[Math.floor(rnd() * P.tree.length)], FLAT),
      x,
      y + 0.35,
      z,
      { cast: false },
    );
    m.scale.set(0.8 + rnd() * 0.6, 0.55 + rnd() * 0.35, 0.8 + rnd() * 0.6);
    m.rotation.y = rnd() * 6;
  }
}
