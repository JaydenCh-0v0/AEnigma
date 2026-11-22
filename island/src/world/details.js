import * as THREE from 'three';
import { LEVEL, PALETTE as P, SEA_LEVEL } from './config.js';
import { put, roundedBox } from './geo.js';
import { rad, shoreDistance } from './terrain.js';
import { seeded } from '../utils/math.js';
import { makeFlower } from './flowers.js';

/** 夜市摊位：西南半岛一带。 */
export function buildMarket(mats, parent) {
  const stalls = [
    [-18, 22, 0.4, P.cloth[0]],
    [-22, 20, -0.2, P.cloth[1]],
    [-15, 24, 0.9, P.cloth[2]],
    [-25, 17, 0.1, P.cloth[3]],
    [-12, 26, -0.5, P.cloth[4]],
  ];

  for (const [x, z, rot, cloth] of stalls) {
    const g = new THREE.Group();
    g.position.set(x, LEVEL.sand, z);
    g.rotation.y = rot;
    parent.add(g);

    put(g, roundedBox(1.8, 0.85, 1.2, 0.1), mats.get(P.wood), 0, 0, 0);
    put(g, roundedBox(2.0, 0.08, 1.4, 0.04), mats.get(cloth), 0, 2.05, 0);
    put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), -0.8, 1.1, -0.5);
    put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), 0.8, 1.1, -0.5);
    put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), -0.8, 1.1, 0.5);
    put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), 0.8, 1.1, 0.5);

    // 摊上小货
    for (let i = 0; i < 4; i++) {
      const bx = -0.55 + i * 0.35;
      put(g, roundedBox(0.22, 0.18, 0.22, 0.04), mats.get(P.cloth[i % P.cloth.length]), bx, 0.9, 0.08, {
        cast: false,
      });
    }
    put(g, new THREE.SphereGeometry(0.14, 8, 6), mats.bulb, 0, 2.35, 0);
  }
}

/** 房屋周边：篱笆、信箱、晾衣绳、烟囱园圃。 */
export function buildHomeExtras(mats, parent) {
  const homes = [
    [8, 10, 0.2],
    [12, 6, -0.4],
    [5, 14, 0.6],
    [-18, 14, 0.1],
    [-22, 10, -0.5],
    [14, -2, 1.1],
  ];

  for (const [x, z, rot] of homes) {
    const g = new THREE.Group();
    g.position.set(x, LEVEL.grass, z);
    g.rotation.y = rot;
    parent.add(g);

    // 烟囱
    put(g, roundedBox(0.45, 1.1, 0.45, 0.06), mats.get(P.rock), 0.9, 2.5, -0.4);

    // 前篱笆（约齐腰）
    for (let i = -2; i <= 2; i++) {
      put(g, new THREE.BoxGeometry(0.12, 0.95, 0.12), mats.get(P.wood), i * 0.55, 0.48, 2.2, { cast: false });
    }
    put(g, new THREE.BoxGeometry(2.4, 0.08, 0.08), mats.get(P.woodDark), 0, 0.9, 2.2, { cast: false });

    // 信箱
    put(g, new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6), mats.get(P.woodDark), 1.7, 0.45, 1.8);
    put(g, roundedBox(0.35, 0.28, 0.22, 0.04), mats.get(P.roofRed), 1.7, 0.95, 1.8);

    // 菜圃 + 几株软陶花
    put(g, roundedBox(1.4, 0.18, 0.9, 0.06), mats.get('#7a5a3e'), -1.6, 0, 1.5, { cast: false });
    for (let i = 0; i < 3; i++) {
      put(g, new THREE.SphereGeometry(0.12, 8, 6), mats.get('#5f9a6a'), -2.0 + i * 0.4, 0.28, 1.5, {
        cast: false,
      });
    }
    const bedRnd = seeded(220 + Math.floor(x * 10 + z));
    for (let i = 0; i < 2; i++) {
      const flower = makeFlower(mats, bedRnd);
      flower.position.set(-1.2 + i * 0.55, 0.12, 1.15);
      flower.scale.setScalar(0.95);
      g.add(flower);
    }
  }

  // 村口路牌
  const sign = new THREE.Group();
  sign.position.set(3, LEVEL.grass, 18);
  parent.add(sign);
  put(sign, new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8), mats.get(P.woodDark), 0, 1.3, 0);
  put(sign, roundedBox(1.8, 0.55, 0.12, 0.06), mats.get(P.path), 0.2, 2.2, 0);
  put(sign, roundedBox(1.5, 0.45, 0.12, 0.05), mats.get(P.path), -0.15, 1.7, 0);
}

/** 海滩：贝壳、漂流木、礁石潮池、棕榈。 */
export function buildBeach(mats, parent) {
  const rnd = seeded(1203);
  const shellColors = ['#fffaf0', '#f0b8b0', '#e9b350', '#d8cdb4'];

  for (let i = 0; i < 55; i++) {
    const th = rnd() * Math.PI * 2;
    const r = rad(th, 0.92 + rnd() * 0.12);
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    if (Math.abs(th - Math.PI / 2) < 0.35) continue;
    const y = LEVEL.sand + 0.02;
    const shell = put(
      parent,
      new THREE.SphereGeometry(0.12 + rnd() * 0.1, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mats.get(shellColors[Math.floor(rnd() * shellColors.length)]),
      x,
      y,
      z,
      { cast: false },
    );
    shell.rotation.set(rnd(), rnd() * 6, rnd());
  }

  // 漂流木
  for (let i = 0; i < 8; i++) {
    const th = 0.4 + i * 0.7 + rnd() * 0.2;
    const r = rad(th, 1.01);
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const log = put(parent, new THREE.CylinderGeometry(0.12, 0.16, 1.6 + rnd(), 7), mats.get(P.woodDark), x, 0.45, z);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = th;
  }

  // 棕榈树靠沙滩
  for (const [x, z] of [
    [20, 12],
    [22, 8],
    [-8, 26],
    [6, 27],
    [28, -4],
  ]) {
    palm(mats, parent, x, z);
  }

  // 潮池礁石
  for (let i = 0; i < 12; i++) {
    const th = -0.4 + i * 0.18;
    const r = rad(th, 1.05);
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const rock = put(
      parent,
      new THREE.DodecahedronGeometry(0.45 + rnd() * 0.35, 0),
      mats.get(P.rock, { flatShading: true }),
      x,
      0.25,
      z,
    );
    rock.rotation.set(rnd(), rnd() * 4, rnd());
  }
}

function palm(mats, parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, LEVEL.sand, z);
  parent.add(g);
  const trunk = put(g, new THREE.CylinderGeometry(0.14, 0.22, 5.2, 7), mats.get(P.trunk), 0.15, 2.6, 0);
  trunk.rotation.z = 0.18;
  for (let i = 0; i < 6; i++) {
    const leaf = put(g, new THREE.ConeGeometry(0.35, 1.8, 5), mats.get('#4f8a64'), 0.4, 5.2, 0, {
      cast: false,
    });
    leaf.rotation.z = 1.05;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
  }
  put(g, new THREE.SphereGeometry(0.18, 8, 6), mats.get('#e9b350'), 0.55, 4.9, 0.15, { cast: false });
  put(g, new THREE.SphereGeometry(0.16, 8, 6), mats.get('#e9b350'), 0.35, 4.8, -0.2, { cast: false });
}

/** 浅海珊瑚与海草（略高出海底，透过浅滩可见）。 */
export function buildReef(mats, parent) {
  const rnd = seeded(778);
  const grass = new THREE.ConeGeometry(0.08, 0.7, 5);
  const coralGeo = new THREE.DodecahedronGeometry(0.35, 0);

  let n = 0;
  for (let i = 0; i < 400 && n < 70; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 28 + rnd() * 18;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const d = shoreDistance(x, z);
    if (d < 0.8 || d > 8) continue;
    if (rnd() < 0.55) {
      const c = put(
        parent,
        coralGeo,
        mats.get(P.coral[Math.floor(rnd() * P.coral.length)], { flatShading: true }),
        x,
        -0.15 + rnd() * 0.2,
        z,
        { cast: false },
      );
      c.scale.setScalar(0.6 + rnd() * 0.9);
      c.rotation.set(rnd(), rnd() * 4, rnd());
    } else {
      for (let k = 0; k < 3; k++) {
        const blade = put(
          parent,
          grass,
          mats.get(k % 2 ? '#2f7a52' : '#7fc077'),
          x + (rnd() - 0.5) * 0.4,
          0.05,
          z + (rnd() - 0.5) * 0.4,
          { cast: false, dynamic: true },
        );
        blade.userData.sway = { phase: rnd() * 10, amp: 0.08 + rnd() * 0.06 };
      }
    }
    n++;
  }
}

/** 长椅、篝火、码头灯笼、水井。 */
export function buildProps(mats, parent) {
  // 港湾长椅
  for (const [x, z, rot] of [
    [-3, 22, 0.2],
    [3, 21, -0.15],
    [18, 6, 1.2],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, LEVEL.grass, z);
    g.rotation.y = rot;
    parent.add(g);
    put(g, roundedBox(1.6, 0.18, 0.55, 0.06), mats.get(P.wood), 0, 0.45, 0);
    put(g, roundedBox(1.6, 0.55, 0.12, 0.04), mats.get(P.woodDark), 0, 0.75, -0.22);
    put(g, new THREE.BoxGeometry(0.12, 0.45, 0.12), mats.get(P.woodDark), -0.65, 0.22, 0.15);
    put(g, new THREE.BoxGeometry(0.12, 0.45, 0.12), mats.get(P.woodDark), 0.65, 0.22, 0.15);
  }

  // 篝火营地
  const fire = new THREE.Group();
  fire.position.set(-6, LEVEL.sand, 24);
  fire.userData.dynamic = true;
  parent.add(fire);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    put(fire, new THREE.DodecahedronGeometry(0.28, 0), mats.get(P.rock, { flatShading: true }), Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7);
  }
  put(fire, new THREE.CylinderGeometry(0.08, 0.1, 0.9, 5), mats.get(P.woodDark), 0.15, 0.35, 0).rotation.z = 0.7;
  put(fire, new THREE.CylinderGeometry(0.08, 0.1, 0.9, 5), mats.get(P.woodDark), -0.1, 0.35, 0.1).rotation.z = -0.55;
  const flame = put(fire, new THREE.ConeGeometry(0.28, 0.7, 6), mats.get('#ff9f4a', { emissive: '#ff6a20', emissiveIntensity: 0.8 }), 0, 0.7, 0, {
    dynamic: true,
  });
  fire.userData.flame = flame;

  // 水井
  const well = new THREE.Group();
  well.position.set(2, LEVEL.grass, 8);
  parent.add(well);
  put(well, new THREE.CylinderGeometry(0.85, 0.95, 0.9, 14), mats.get(P.rock), 0, 0.45, 0);
  put(well, new THREE.TorusGeometry(0.85, 0.1, 6, 16), mats.get(P.path), 0, 0.9, 0).rotation.x = Math.PI / 2;
  put(well, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), mats.get(P.woodDark), -0.9, 1.5, 0);
  put(well, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), mats.get(P.woodDark), 0.9, 1.5, 0);
  put(well, new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), mats.get(P.wood), 0, 2.25, 0).rotation.z = Math.PI / 2;
  put(well, new THREE.CylinderGeometry(0.2, 0.22, 0.28, 10), mats.get(P.wood), 0, 1.35, 0);

  // 码头灯笼
  for (const z of [26, 32, 37]) {
    put(parent, new THREE.CylinderGeometry(0.06, 0.07, 1.8, 6), mats.get(P.woodDark), -1.7, 1.8, z);
    put(parent, new THREE.SphereGeometry(0.22, 10, 8), mats.bulb, -1.7, 2.8, z);
  }
}

/** 软陶小人：站在码头、村里、夜市。 */
export function buildPeople(mats, parent) {
  const spots = [
    [0.8, LEVEL.sand + 0.95, 36.5, 0],
    [-0.6, LEVEL.sand + 0.95, 34, Math.PI],
    [-20, LEVEL.sand, 21, 0.5],
    [-16, LEVEL.sand, 23.5, -0.8],
    [9, LEVEL.grass, 11.5, 0.3],
    [11, LEVEL.grass, 8, -1.2],
    [19, LEVEL.grass, 5, 2],
    [-10, LEVEL.grass, 16, 0.1],
  ];

  const people = new THREE.Group();
  people.userData.dynamic = true;
  parent.add(people);

  spots.forEach(([x, y, z, rot], i) => {
    const p = person(mats, i);
    p.position.set(x, y, z);
    p.rotation.y = rot;
    p.userData.bobPhase = i * 1.3;
    people.add(p);
  });

  people.userData.update = (t) => {
    people.children.forEach((p) => {
      p.position.y = p.userData.baseY + Math.sin(t * 2.2 + p.userData.bobPhase) * 0.02;
      p.rotation.y = p.userData.baseRot + Math.sin(t * 0.7 + p.userData.bobPhase) * 0.08;
    });
  };

  // 记录基准
  people.children.forEach((p) => {
    p.userData.baseY = p.position.y;
    p.userData.baseRot = p.rotation.y;
  });

  return people;
}

function person(mats, seed) {
  const rnd = seeded(900 + seed);
  const g = new THREE.Group();
  // ~1.55 m clay adult so doors / stalls / fences read correctly
  g.scale.setScalar(1.15);
  const shirt = P.shirt[Math.floor(rnd() * P.shirt.length)];
  put(g, new THREE.CylinderGeometry(0.22, 0.26, 0.7, 8), mats.get(shirt), 0, 0.55, 0);
  put(g, new THREE.SphereGeometry(0.22, 10, 8), mats.get(P.skin), 0, 1.1, 0);
  put(g, new THREE.SphereGeometry(0.24, 10, 8), mats.get('#3a2f28'), 0, 1.22, 0).scale.set(1, 0.55, 1);
  put(g, new THREE.CylinderGeometry(0.08, 0.09, 0.45, 6), mats.get(shirt), -0.28, 0.55, 0);
  put(g, new THREE.CylinderGeometry(0.08, 0.09, 0.45, 6), mats.get(shirt), 0.28, 0.55, 0);
  put(g, new THREE.CylinderGeometry(0.09, 0.1, 0.45, 6), mats.get('#3f4a55'), -0.1, 0.18, 0);
  put(g, new THREE.CylinderGeometry(0.09, 0.1, 0.45, 6), mats.get('#3f4a55'), 0.1, 0.18, 0);
  return g;
}

export { buildBirds } from './birds.js';
export { buildSparrows } from './sparrows.js';
export { buildLongTits } from './longTits.js';

/** 近海鱼群与鳐鱼：贴着水面下掠过。 */
export function buildFishSchools(mats, parent) {
  const schools = new THREE.Group();
  schools.userData.dynamic = true;
  parent.add(schools);

  const geo = new THREE.ConeGeometry(0.12, 0.45, 5);
  const routes = [
    { cx: -5, cz: 40, r: 6, speed: 0.38, phase: 0.2, y: SEA_LEVEL - 0.35 },
    { cx: 10, cz: 44, r: 7, speed: 0.42, phase: 1.4, y: SEA_LEVEL - 0.4 },
    { cx: 28, cz: 22, r: 8, speed: 0.33, phase: 2.1, y: SEA_LEVEL - 0.32 },
    { cx: -16, cz: 38, r: 9, speed: 0.3, phase: 3.2, y: SEA_LEVEL - 0.38 },
    { cx: 18, cz: 36, r: 5.5, speed: 0.5, phase: 4.0, y: SEA_LEVEL - 0.28 },
    { cx: 4, cz: 48, r: 11, speed: 0.26, phase: 5.1, y: SEA_LEVEL - 0.45 },
  ];

  routes.forEach((route, s) => {
    const school = new THREE.Group();
    const color = P.fish[s % P.fish.length];
    const count = 8 + (s % 3);
    for (let i = 0; i < count; i++) {
      const f = put(
        school,
        geo,
        mats.get(color),
        (i % 4) * 0.32 - 0.48,
        (i % 2) * 0.12,
        Math.floor(i / 4) * 0.38,
        { cast: false },
      );
      f.rotation.x = Math.PI / 2;
      f.scale.setScalar(0.75 + (i % 3) * 0.12);
    }
    school.userData.route = route;
    schools.add(school);
  });

  // 海豚跃出水面（约 2.5–3 m 体长）
  for (let i = 0; i < 3; i++) {
    const dolphin = new THREE.Group();
    dolphin.scale.setScalar(2.0);
    const body = put(dolphin, new THREE.SphereGeometry(0.45, 10, 8), mats.get(P.fish[3] || '#6c8ca4'), 0, 0, 0, {
      cast: false,
    });
    body.scale.set(1.6, 0.7, 0.85);
    put(dolphin, new THREE.ConeGeometry(0.18, 0.7, 6), mats.get('#6c8ca4'), 0, 0.15, 0.55, { cast: false }).rotation.x =
      -0.4;
    put(dolphin, new THREE.ConeGeometry(0.22, 0.55, 5), mats.get('#5a7a90'), 0, 0.45, -0.1, { cast: false });
    put(dolphin, new THREE.ConeGeometry(0.12, 0.5, 5), mats.get('#5a7a90'), 0, 0, -0.75, { cast: false }).rotation.x =
      Math.PI / 2;
    dolphin.userData.route = {
      cx: -8 + i * 14,
      cz: 46 + i * 2,
      r: 10 + i * 2,
      speed: 0.28 + i * 0.05,
      phase: i * 1.9,
      y: SEA_LEVEL - 0.2,
      dolphin: true,
    };
    schools.add(dolphin);
  }

  // 两只宽翼鳐
  for (let i = 0; i < 2; i++) {
    const ray = new THREE.Group();
    const body = put(ray, new THREE.SphereGeometry(0.55, 10, 8), mats.get('#24323c'), 0, 0, 0, { cast: false });
    body.scale.set(1.4, 0.28, 1.1);
    const wingL = put(ray, new THREE.SphereGeometry(0.7, 10, 8), mats.get('#2c3a46'), -0.85, 0, 0, { cast: false });
    wingL.scale.set(1.3, 0.12, 0.7);
    const wingR = put(ray, new THREE.SphereGeometry(0.7, 10, 8), mats.get('#2c3a46'), 0.85, 0, 0, { cast: false });
    wingR.scale.set(1.3, 0.12, 0.7);
    put(ray, new THREE.ConeGeometry(0.08, 1.2, 5), mats.get('#1b242c'), 0, 0, -0.95, { cast: false }).rotation.x =
      Math.PI / 2;
    ray.userData.route = {
      cx: 8 + i * 16,
      cz: 34 + i * 4,
      r: 14 + i * 3,
      speed: 0.18 + i * 0.04,
      phase: i * 2.4,
      y: SEA_LEVEL - 0.7,
      ray: true,
    };
    ray.userData.wings = [wingL, wingR];
    schools.add(ray);
  }

  schools.userData.update = (t) => {
    schools.children.forEach((school) => {
      const r = school.userData.route;
      const a = t * r.speed + r.phase;
      let y = r.y + Math.sin(t * 2 + r.phase) * 0.08;
      let pitch = 0;
      if (r.dolphin) {
        const leap = Math.sin(t * r.speed * 2.2 + r.phase);
        y = SEA_LEVEL - 0.35 + Math.max(0, leap) * 2.4;
        pitch = leap * 0.7;
      }
      school.position.set(r.cx + Math.cos(a) * r.r, y, r.cz + Math.sin(a) * r.r);
      school.rotation.y = -a + Math.PI / 2;
      school.rotation.x = pitch;
      if (school.userData.wings) {
        const flap = Math.sin(t * 3.2 + r.phase) * 0.22;
        school.userData.wings[0].rotation.z = flap;
        school.userData.wings[1].rotation.z = -flap;
      }
    });
  };

  return schools;
}

/** 夜间萤火虫。 */
export function buildFireflies(parent) {
  const n = 48;
  const pos = new Float32Array(n * 3);
  const phases = [];
  const rnd = seeded(55);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 6 + rnd() * 22;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = LEVEL.grass + 1 + rnd() * 4;
    pos[i * 3 + 2] = Math.sin(a) * r;
    phases.push(rnd() * Math.PI * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: '#d6ff8a',
    size: 0.35,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.dynamic = true;
  parent.add(points);

  return {
    points,
    update(t, night) {
      mat.opacity = Math.max(0, night - 0.35) * 0.95;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < n; i++) {
        arr[i * 3 + 1] += Math.sin(t * 1.8 + phases[i]) * 0.004;
        arr[i * 3] += Math.cos(t * 0.6 + phases[i]) * 0.003;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/** 烟囱炊烟。 */
export function buildSmoke(parent) {
  const puffs = new THREE.Group();
  puffs.userData.dynamic = true;
  parent.add(puffs);
  const geo = new THREE.SphereGeometry(0.35, 10, 8);

  const chimneys = [
    [8.9, LEVEL.grass + 3.6, 9.6],
    [12.9, LEVEL.grass + 3.6, 5.6],
    [5.9, LEVEL.grass + 3.6, 13.6],
    [-17.1, LEVEL.grass + 3.6, 13.6],
    [-21.1, LEVEL.grass + 3.6, 9.6],
    [14.9, LEVEL.grass + 3.6, -2.4],
  ];

  chimneys.forEach(([x, y, z], i) => {
    for (let k = 0; k < 3; k++) {
      const mat = new THREE.MeshStandardMaterial({
        color: '#dfe6ea',
        transparent: true,
        opacity: 0.35,
        roughness: 1,
        depthWrite: false,
      });
      const m = put(puffs, geo, mat, x, y + k * 0.5, z, { cast: false, dynamic: true });
      m.userData.smoke = { baseX: x, baseY: y, baseZ: z, phase: i * 1.1 + k * 0.8 };
    }
  });

  puffs.userData.update = (t) => {
    puffs.children.forEach((m) => {
      const s = m.userData.smoke;
      const u = ((t * 0.35 + s.phase) % 3) / 3;
      m.position.set(
        s.baseX + Math.sin(t * 0.4 + s.phase) * 0.35 * u,
        s.baseY + u * 2.8,
        s.baseZ + Math.cos(t * 0.35 + s.phase) * 0.2 * u,
      );
      m.scale.setScalar(0.5 + u * 1.4);
      m.material.opacity = 0.35 * (1 - u);
    });
  };

  return puffs;
}

/** 旗帜随风摆动。 */
export function animateFlags(root, t) {
  root.traverse((o) => {
    if (o.userData.flag) {
      o.rotation.z = Math.sin(t * 3 + (o.userData.flagPhase || 0)) * 0.28;
    }
  });
}

/** 海草摇摆。 */
export function animateSway(root, t) {
  root.traverse((o) => {
    if (o.userData.sway) {
      const { phase, amp } = o.userData.sway;
      o.rotation.z = Math.sin(t * 1.6 + phase) * amp;
      o.rotation.x = Math.cos(t * 1.2 + phase) * amp * 0.5;
    }
  });
}
