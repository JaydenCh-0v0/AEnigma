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
  // 栏杆
  for (const x of [-1.5, 1.5]) {
    for (let z = 24; z < 38; z += 1.3) {
      put(parent, new THREE.CylinderGeometry(0.05, 0.05, 0.85, 6), mats.get(P.woodDark), x, 1.45, z, {
        cast: false,
      });
    }
    put(parent, new THREE.CylinderGeometry(0.04, 0.04, 14, 6), mats.get(P.wood), x, 1.85, 31).rotation.x =
      Math.PI / 2;
  }
  const post = new THREE.CylinderGeometry(0.14, 0.14, 2.2, 7);
  for (const z of [24.5, 28.1, 31.7, 35.3]) {
    put(parent, post, mats.get(P.woodDark), -1.45, 0.1, z);
    put(parent, post, mats.get(P.woodDark), 1.45, 0.1, z);
  }
  put(parent, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10), mats.get(P.woodDark), -1.3, 1.3, 37.75);
  put(parent, roundedBox(0.8, 0.7, 0.8, 0.1), mats.get(P.woodDark), 1, 1.07, 36.6);
  put(parent, roundedBox(0.6, 0.5, 0.6, 0.1), mats.get(P.wood), 1.05, 1.77, 36.6);

  // 鱼桶与绳圈
  const bucket = new THREE.Group();
  bucket.position.set(0.45, 1.08, 37.25);
  parent.add(bucket);
  put(bucket, new THREE.CylinderGeometry(0.24, 0.2, 0.42, 14, 1, true), mats.get(P.wood, { side: THREE.DoubleSide }), 0, 0.21, 0);
  put(bucket, new THREE.CircleGeometry(0.22, 14), mats.get(P.seaShallow), 0, 0.32, 0, { cast: false }).rotation.x =
    -Math.PI / 2;
  put(parent, new THREE.TorusGeometry(0.35, 0.05, 6, 14), mats.get(P.woodDark), -1.1, 1.2, 36.2).rotation.x =
    Math.PI / 2;
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
  // 百叶窗与门廊台阶
  put(g, roundedBox(0.18, 0.7, 0.08, 0.03), mats.get(roof), -w * 0.28 - 0.4, h * 0.45, d / 2 + 0.03, {
    cast: false,
  });
  put(g, roundedBox(0.18, 0.7, 0.08, 0.03), mats.get(roof), w * 0.28 + 0.4, h * 0.45, d / 2 + 0.03, {
    cast: false,
  });
  put(g, roundedBox(0.9, 0.18, 0.55, 0.05), mats.get(P.path), 0, 0, d / 2 + 0.35, { cast: false });
  put(g, roundedBox(0.35, 0.12, 0.35, 0.04), mats.get('#d65a4a'), w * 0.35, h + rh * 0.35, 0, { cast: false });
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
  put(pavilion, roundedBox(1.2, 0.35, 0.5, 0.06), mats.get(P.wood), 0, 0.35, 0.6, { cast: false });
  put(pavilion, new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8), mats.get(P.woodDark), 0.9, 0.4, -0.8);
  put(pavilion, new THREE.SphereGeometry(0.2, 10, 8), mats.bulb, 0.9, 0.75, -0.8);

  // 小码头棚屋
  const shed = new THREE.Group();
  shed.position.set(-4, LEVEL.sand, 28);
  shed.rotation.y = 0.25;
  parent.add(shed);
  put(shed, roundedBox(3.4, 2.1, 2.6, 0.16), mats.get(P.wall), 0, 0, 0);
  put(shed, gableRoof(3.8, 2.9, 1.2), mats.get(P.roofBlue), 0, 2.0, 0);
  put(shed, roundedBox(1.1, 1.4, 0.1, 0.05), mats.get(P.woodDark), 0, 0, 1.35);
  put(shed, roundedBox(0.7, 0.7, 0.08, 0.04), mats.window, -1.0, 1.1, 1.32);
}

export function buildBoats(mats, parent) {
  const boats = new THREE.Group();
  boats.userData.dynamic = true;
  parent.add(boats);

  const hullGeo = new THREE.BoxGeometry(2.4, 0.55, 1.05);
  const mastGeo = new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6);
  const sailGeo = new THREE.PlaneGeometry(1.2, 1.6);

  const specs = [
    { x: 8, z: 42, yaw: 0.4, sail: P.cloth[0] },
    { x: -12, z: 46, yaw: -0.8, sail: P.cloth[1] },
    { x: 34, z: 18, yaw: 1.3, sail: P.cloth[2] },
    { x: 2, z: 39.5, yaw: 0.1, sail: P.cloth[3], docked: true },
  ];

  for (const s of specs) {
    const b = new THREE.Group();
    b.position.set(s.x, SEA_LEVEL + 0.15, s.z);
    b.rotation.y = s.yaw;
    b.userData.docked = !!s.docked;
    b.userData.home = { x: s.x, z: s.z };
    boats.add(b);
    put(b, hullGeo, mats.get(P.wall), 0, 0, 0);
    put(b, new THREE.BoxGeometry(0.35, 0.35, 0.55), mats.get(P.woodDark), 0.7, 0.35, 0);
    put(b, mastGeo, mats.get(P.woodDark), 0, 1.3, 0);
    const sail = put(b, sailGeo, mats.get(s.sail), 0.35, 1.5, 0, { cast: false });
    sail.rotation.y = Math.PI / 2;
    put(b, new THREE.SphereGeometry(0.08, 6, 6), mats.get(P.roofRed), 1.15, 0.1, 0, { cast: false });
  }

  boats.userData.bob = (t) => {
    boats.children.forEach((b, i) => {
      const amp = b.userData.docked ? 0.04 : 0.08;
      const home = b.userData.home;
      b.position.y = SEA_LEVEL + 0.15 + Math.sin(t * 1.4 + i * 1.7) * amp;
      b.rotation.z = Math.sin(t * 1.1 + i) * (amp * 0.5);
      b.rotation.x = Math.cos(t * 0.9 + i * 0.5) * (amp * 0.4);
      if (!b.userData.docked) {
        b.position.x = home.x + Math.sin(t * 0.15 + i) * 0.45;
        b.position.z = home.z + Math.cos(t * 0.12 + i) * 0.45;
      }
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
  for (let i = 0; i < 8; i++) {
    const a = 0.15 + i * 0.22;
    const r = 27.5 + rnd() * 2.5;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    put(parent, new THREE.CylinderGeometry(0.05, 0.06, 2.8, 6), mats.get(P.wood), x, LEVEL.sand + 1.4, z);
    const flag = put(
      parent,
      new THREE.PlaneGeometry(0.9, 0.55),
      mats.get(P.cloth[i % P.cloth.length]),
      x + 0.45,
      LEVEL.sand + 2.5,
      z,
      { cast: false, dynamic: true },
    );
    flag.rotation.y = a + Math.PI / 2;
    flag.userData.flag = true;
    flag.userData.flagPhase = rnd() * 10;
  }

  // 更多路灯串到夜市
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = -8 - t * 14;
    const z = 18 + t * 6;
    const g = new THREE.Group();
    g.position.set(x, LEVEL.sand, z);
    parent.add(g);
    put(g, new THREE.CylinderGeometry(0.07, 0.09, 2.4, 8), mats.get(P.woodDark), 0, 1.2, 0);
    put(g, new THREE.SphereGeometry(0.18, 10, 8), mats.bulb, 0, 2.45, 0);
    lampPosts.push(new THREE.Vector3(x, LEVEL.sand + 2.45, z));
  }

  return lampPosts;
}
