import * as THREE from 'three';
import { LEVEL, PALETTE as P, SEA_LEVEL } from './config.js';
import { gableRoof, put, roundedBox } from './geo.js';
import { MAIN_PEAK, PEAK_TOP } from './terrain.js';
import { seeded } from '../utils/math.js';

export function buildLighthouse(mats, parent) {
  const g = new THREE.Group();
  g.position.set(26.5, LEVEL.sand, 2.2);
  parent.add(g);

  put(g, roundedBox(4.2, 0.55, 4.2, 0.25), mats.get(P.sand), 0, 0, 0, { cast: false });
  put(g, new THREE.CylinderGeometry(1.35, 1.7, 7.2, 16), mats.get(P.lhWhite), 0, 3.6, 0);
  put(g, new THREE.CylinderGeometry(1.45, 1.45, 1.4, 16), mats.get(P.lhRed), 0, 2.2, 0);
  put(g, new THREE.CylinderGeometry(1.45, 1.45, 1.4, 16), mats.get(P.lhRed), 0, 5.0, 0);

  const lantern = put(g, new THREE.CylinderGeometry(1.1, 1.1, 1.6, 12, 1, true), mats.get(P.glass), 0, 7.8, 0);
  lantern.material = mats.window;

  const bulb = put(g, new THREE.SphereGeometry(0.45, 12, 10), mats.bulb, 0, 7.8, 0, { dynamic: true });
  put(g, new THREE.ConeGeometry(1.35, 1.1, 16), mats.get(P.lhRed), 0, 9.0, 0);

  const beam = new THREE.SpotLight('#ffd9a0', 0, 90, Math.PI / 7, 0.45, 1.2);
  beam.position.set(0, 7.8, 0);
  beam.target.position.set(18, 1, 8);
  g.add(beam);
  g.add(beam.target);
  beam.userData.dynamic = true;

  return { bulb, beam, windowMat: mats.window, bulbMat: mats.bulb };
}

export function buildPier(mats, parent) {
  const plank = new THREE.BoxGeometry(3.2, 0.25, 1.15);
  for (let z = 23.5; z < 38.5; z += 1.3) {
    put(parent, plank, mats.get(P.wood), 0, 0.95, z);
  }
  const post = new THREE.CylinderGeometry(0.14, 0.14, 2.2, 7);
  for (const z of [24.5, 28.1, 31.7, 35.3]) {
    put(parent, post, mats.get(P.woodDark), -1.45, 0.1, z);
    put(parent, post, mats.get(P.woodDark), 1.45, 0.1, z);
  }
  put(parent, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10), mats.get(P.woodDark), -1.3, 1.3, 37.75);
  put(parent, roundedBox(0.8, 0.7, 0.8, 0.1), mats.get(P.woodDark), 1, 1.07, 36.6);
  put(parent, roundedBox(0.6, 0.5, 0.6, 0.1), mats.get(P.wood), 1.05, 1.77, 36.6);
}

function house(mats, parent, x, z, opts) {
  const { w = 3.2, d = 3.6, h = 2.3, rh = 1.35, roof = P.roofRed, wall = P.wall, rot = 0 } = opts;
  const g = new THREE.Group();
  g.position.set(x, LEVEL.grass, z);
  g.rotation.y = rot;
  parent.add(g);
  put(g, roundedBox(w, h, d, 0.18), mats.get(wall), 0, 0, 0);
  const roofMesh = put(g, gableRoof(w + 0.35, d + 0.2, rh), mats.get(roof), 0, h - 0.05, 0);
  roofMesh.castShadow = true;
  put(g, roundedBox(0.55, 0.9, 0.08, 0.05), mats.get(P.woodDark), 0, 0, d / 2 + 0.02);
  put(g, roundedBox(0.7, 0.7, 0.08, 0.05), mats.window, -w * 0.28, h * 0.45, d / 2 + 0.02);
  put(g, roundedBox(0.7, 0.7, 0.08, 0.05), mats.window, w * 0.28, h * 0.45, d / 2 + 0.02);
}

export function buildVillage(mats, parent) {
  const homes = [
    [8, 10, 0.2, P.roofRed],
    [12, 6, -0.4, P.roofBlue],
    [5, 14, 0.6, P.roofYellow],
    [-18, 14, 0.1, P.roofBlue],
    [-22, 10, -0.5, P.roofRed],
    [14, -2, 1.1, P.roofYellow],
  ];
  for (const [x, z, rot, roof] of homes) {
    house(mats, parent, x, z, { roof, rot });
  }

  // 观景亭
  const pavilion = new THREE.Group();
  pavilion.position.set(MAIN_PEAK.x, PEAK_TOP, MAIN_PEAK.z);
  parent.add(pavilion);
  put(pavilion, roundedBox(3.2, 0.2, 3.2, 0.12), mats.get(P.path), 0, 0, 0);
  for (const [x, z] of [
    [-1.2, -1.2],
    [1.2, -1.2],
    [-1.2, 1.2],
    [1.2, 1.2],
  ]) {
    put(pavilion, new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), mats.get(P.wood), x, 1.1, z);
  }
  put(pavilion, gableRoof(3.6, 3.6, 1.4), mats.get(P.roofRed), 0, 2.15, 0);
}

export function buildBoats(mats, parent) {
  const boats = new THREE.Group();
  boats.userData.dynamic = true;
  parent.add(boats);

  const hullGeo = new THREE.BoxGeometry(2.4, 0.55, 1.05);
  const mastGeo = new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6);
  const sailGeo = new THREE.PlaneGeometry(1.2, 1.6);

  const specs = [
    { x: 8, z: 42, yaw: 0.4 },
    { x: -12, z: 46, yaw: -0.8 },
    { x: 34, z: 18, yaw: 1.3 },
  ];

  for (const s of specs) {
    const b = new THREE.Group();
    b.position.set(s.x, SEA_LEVEL + 0.15, s.z);
    b.rotation.y = s.yaw;
    boats.add(b);
    put(b, hullGeo, mats.get(P.wall), 0, 0, 0);
    put(b, mastGeo, mats.get(P.woodDark), 0, 1.3, 0);
    const sail = put(b, sailGeo, mats.get('#fffdf6'), 0.35, 1.5, 0, { cast: false });
    sail.rotation.y = Math.PI / 2;
  }

  boats.userData.bob = (t) => {
    boats.children.forEach((b, i) => {
      b.position.y = SEA_LEVEL + 0.15 + Math.sin(t * 1.4 + i * 1.7) * 0.08;
      b.rotation.z = Math.sin(t * 1.1 + i) * 0.04;
      b.rotation.x = Math.cos(t * 0.9 + i * 0.5) * 0.03;
    });
  };

  return boats;
}

export function buildDecor(mats, parent) {
  const rnd = seeded(440);
  const lampPosts = [];

  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = 1 + t * 20;
    const z = 22 - t * 18;
    const g = new THREE.Group();
    g.position.set(x, LEVEL.grass, z);
    parent.add(g);
    put(g, new THREE.CylinderGeometry(0.07, 0.09, 2.4, 8), mats.get(P.woodDark), 0, 1.2, 0);
    put(g, new THREE.SphereGeometry(0.18, 10, 8), mats.bulb, 0, 2.45, 0);
    lampPosts.push(new THREE.Vector3(x, LEVEL.grass + 2.45, z));
  }

  // 岸边礁石旁的小旗帜
  for (let i = 0; i < 5; i++) {
    const a = 0.2 + i * 0.15;
    const r = 28 + rnd() * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    put(parent, new THREE.CylinderGeometry(0.05, 0.06, 2.8, 6), mats.get(P.wood), x, LEVEL.sand + 1.4, z);
    const flag = put(parent, new THREE.PlaneGeometry(0.9, 0.55), mats.get(P.roofRed), x + 0.45, LEVEL.sand + 2.5, z, {
      cast: false,
      dynamic: true,
    });
    flag.rotation.y = a + Math.PI / 2;
  }

  return lampPosts;
}
