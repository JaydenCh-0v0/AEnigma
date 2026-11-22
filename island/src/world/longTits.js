import * as THREE from 'three';
import { put } from './geo.js';
import { LEVEL } from './config.js';
import { MAIN_PEAK, PEAK_TOP } from './terrain.js';
import { seeded } from '../utils/math.js';

/**
 * 软陶银喉长尾山雀 Aegithalos glaucogularis
 * 参考：中国鸟类野外手册 / 中国动物志 — 黑顶浅纵纹、头侧葡萄棕、银喉斑、粉腹、超长黑尾白边
 * Cornell / RSPB — 树冠跳跃、倒挂觅食、bounce 短飞、「blob and line」剪影、follow-the-leader 过空地
 */

const COLORS = {
  crown: '#1f1a18',
  crownStripe: '#f4efe6',
  face: '#e8b8a8',
  back: '#c5ced6',
  belly: '#fff8f4',
  pink: '#f0b8b0',
  silver: '#ffffff',
  wing: '#2e2926',
  tail: '#1a1614',
  tailEdge: '#ffffff',
  beak: '#1f1a18',
  eye: '#111010',
  leg: '#5a4840',
};

const STATES = {
  PERCH: 'perch',
  HOP: 'hop',
  HANG: 'hang',
  FLY: 'fly',
};

function makeLongTit(mats) {
  const bird = new THREE.Group();
  bird.userData.dynamic = true;

  // 「blob」：极圆蓬松小身
  const torso = put(bird, new THREE.SphereGeometry(0.2, 12, 10), mats.get(COLORS.back), 0, 0.06, 0, {
    cast: false,
  });
  torso.scale.set(1.05, 1.0, 1.15);

  const belly = put(bird, new THREE.SphereGeometry(0.17, 10, 8), mats.get(COLORS.belly), 0, -0.02, 0.02, {
    cast: false,
  });
  belly.scale.set(0.95, 0.85, 1.05);

  // 肩粉 / 腹侧粉晕
  put(bird, new THREE.SphereGeometry(0.1, 8, 7), mats.get(COLORS.pink), 0.12, 0.02, 0.02, { cast: false }).scale.set(
    0.55,
    0.7,
    0.9,
  );
  put(bird, new THREE.SphereGeometry(0.1, 8, 7), mats.get(COLORS.pink), -0.12, 0.02, 0.02, { cast: false }).scale.set(
    0.55,
    0.7,
    0.9,
  );

  // 黑顶 + 浅色中央纵纹
  put(bird, new THREE.SphereGeometry(0.13, 10, 8), mats.get(COLORS.crown), 0, 0.18, -0.16, { cast: false }).scale.set(
    1.15,
    0.65,
    1.05,
  );
  put(bird, new THREE.SphereGeometry(0.05, 7, 6), mats.get(COLORS.crownStripe), 0, 0.22, -0.16, {
    cast: false,
  }).scale.set(0.45, 0.55, 1.2);

  // 头侧葡萄棕
  const head = put(bird, new THREE.SphereGeometry(0.13, 10, 8), mats.get(COLORS.face), 0, 0.12, -0.22, {
    cast: false,
  });
  head.scale.set(1.05, 0.95, 1.0);

  // 银喉斑
  put(bird, new THREE.SphereGeometry(0.055, 7, 6), mats.get(COLORS.silver), 0, 0.05, -0.3, { cast: false }).scale.set(
    1.1,
    0.7,
    0.85,
  );

  const beak = put(bird, new THREE.ConeGeometry(0.035, 0.09, 5), mats.get(COLORS.beak), 0, 0.1, -0.34, {
    cast: false,
  });
  beak.rotation.x = -Math.PI / 2;

  put(bird, new THREE.SphereGeometry(0.022, 6, 5), mats.get(COLORS.eye), 0.06, 0.14, -0.26, { cast: false });
  put(bird, new THREE.SphereGeometry(0.022, 6, 5), mats.get(COLORS.eye), -0.06, 0.14, -0.26, { cast: false });

  // 「line」：尾长超过体长（blob-and-line）
  const tail = new THREE.Group();
  tail.position.set(0, 0.05, 0.14);
  bird.add(tail);
  put(tail, new THREE.BoxGeometry(0.08, 0.045, 0.95), mats.get(COLORS.tail, { flatShading: true }), 0, 0, 0.48, {
    cast: false,
  });
  put(tail, new THREE.BoxGeometry(0.12, 0.03, 0.92), mats.get(COLORS.tailEdge, { flatShading: true }), 0.055, 0.012, 0.48, {
    cast: false,
  });
  put(tail, new THREE.BoxGeometry(0.12, 0.03, 0.92), mats.get(COLORS.tailEdge, { flatShading: true }), -0.055, 0.012, 0.48, {
    cast: false,
  });

  function wingSide(sign) {
    const root = new THREE.Group();
    root.position.set(0.08 * sign, 0.08, -0.02);
    bird.add(root);
    const mesh = put(
      root,
      new THREE.BoxGeometry(0.32, 0.07, 0.2),
      mats.get(COLORS.wing, { flatShading: true }),
      0.14 * sign,
      0.01,
      0,
      { cast: false },
    );
    mesh.rotation.set(0.05, -0.1 * sign, 0.4 * sign);
    return root;
  }

  const leftWing = wingSide(-1);
  const rightWing = wingSide(1);
  // 默认收翼
  leftWing.rotation.z = 0.55;
  rightWing.rotation.z = -0.55;
  leftWing.rotation.x = -0.35;
  rightWing.rotation.x = -0.35;

  // 细腿
  put(bird, new THREE.CylinderGeometry(0.015, 0.02, 0.12, 5), mats.get(COLORS.leg), 0.04, -0.12, 0.01, {
    cast: false,
  });
  put(bird, new THREE.CylinderGeometry(0.015, 0.02, 0.12, 5), mats.get(COLORS.leg), -0.04, -0.12, 0.01, {
    cast: false,
  });

  bird.userData.wings = { left: leftWing, right: rightWing };
  bird.userData.tail = tail;
  bird.userData.head = head;
  // ~0.55 m tip-to-tail — smaller than sparrows, readable at pavilion
  bird.scale.setScalar(0.38);
  return bird;
}

export function buildLongTits(mats, parent) {
  const flock = new THREE.Group();
  flock.userData.dynamic = true;
  parent.add(flock);

  const rnd = seeded(727);
  const px = MAIN_PEAK.x;
  const pz = MAIN_PEAK.z;
  const py = PEAK_TOP;

  // 只围着观景亭活动，保证「山顶」镜头一眼能看到
  const perches = [
    new THREE.Vector3(px - 1.4, py + 1.25, pz + 0.8),
    new THREE.Vector3(px + 1.3, py + 1.2, pz - 0.5),
    new THREE.Vector3(px + 0.15, py + 2.45, pz + 0.15),
    new THREE.Vector3(px - 2.2, py + 1.05, pz - 1.4),
    new THREE.Vector3(px + 2.4, py + 1.1, pz + 1.3),
    new THREE.Vector3(px - 0.9, py + 0.95, pz + 1.9),
    new THREE.Vector3(px + 0.8, py + 0.9, pz - 1.8),
    new THREE.Vector3(px - 2.8, py + 1.55, pz + 0.2),
    new THREE.Vector3(px + 2.9, py + 1.5, pz - 0.3),
    new THREE.Vector3(px - 1.6, py + 2.1, pz - 0.9),
    new THREE.Vector3(px + 1.7, py + 2.0, pz + 0.7),
    new THREE.Vector3(px, py + 1.7, pz + 1.4),
  ];

  const COUNT = 12;
  const birds = [];
  const aim = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  const bankAxis = new THREE.Vector3(0, 0, 1);
  const pitchAxis = new THREE.Vector3(1, 0, 0);
  const bankQ = new THREE.Quaternion();
  const pitchQ = new THREE.Quaternion();
  const baseQ = new THREE.Quaternion();

  // Follow-the-leader：共用一条过空地航线队列
  const convoy = {
    active: false,
    cooldown: 0.4,
  };

  for (let i = 0; i < COUNT; i++) {
    const bird = makeLongTit(mats);
    const perchIdx = i % perches.length;
    const pos = perches[perchIdx].clone();
    pos.x += (rnd() - 0.5) * 0.55;
    pos.y += (rnd() - 0.5) * 0.25;
    pos.z += (rnd() - 0.5) * 0.55;

    bird.position.copy(pos);
    flock.add(bird);

    birds.push({
      mesh: bird,
      state: STATES.PERCH,
      timer: 0.3 + rnd() * 1.2,
      perchIdx,
      pos: pos.clone(),
      vel: new THREE.Vector3(),
      prevVel: new THREE.Vector3(),
      target: pos.clone(),
      hopFrom: new THREE.Vector3(),
      hopTo: new THREE.Vector3(),
      hopT: 0,
      hopDur: 0.2,
      flyStart: new THREE.Vector3(),
      flyProgress: 0,
      flyDur: 1,
      flyDelay: 0,
      bank: 0,
      pitch: 0,
      flapPhase: rnd() * Math.PI * 2,
      flapRate: 18 + rnd() * 6,
      lookYaw: rnd() * Math.PI * 2,
      bob: rnd() * Math.PI * 2,
      hangAmt: 0,
      tailFlick: rnd() * Math.PI * 2,
      queueOrder: i,
    });
  }

  function foldWings(b, amt) {
    const { left, right } = b.mesh.userData.wings;
    left.rotation.z = THREE.MathUtils.lerp(0.1, 0.6, amt);
    right.rotation.z = THREE.MathUtils.lerp(-0.1, -0.6, amt);
    left.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amt);
    right.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amt);
  }

  function flapWings(b, t, amp) {
    const { left, right } = b.mesh.userData.wings;
    const flap = Math.sin(t * b.flapRate + b.flapPhase) * amp;
    left.rotation.z = flap;
    right.rotation.z = -flap;
    left.rotation.x = 0.1;
    right.rotation.x = 0.1;
  }

  function setPerchPose(b, t) {
    b.mesh.position.copy(b.pos);
    b.mesh.position.y += Math.sin(t * 3.5 + b.bob) * 0.01;
    aim.position.copy(b.mesh.position);
    aim.lookAt(
      b.mesh.position.x + Math.sin(b.lookYaw),
      b.mesh.position.y,
      b.mesh.position.z + Math.cos(b.lookYaw),
    );
    b.mesh.quaternion.copy(aim.quaternion);
    // 轻量倒挂：侧倾探枝，避免整只钻进岩体
    if (b.hangAmt > 0.01) {
      b.mesh.rotateX(b.hangAmt * 1.15);
      b.mesh.rotateZ(b.hangAmt * 0.55);
    }
    foldWings(b, 0.88);
    const tail = b.mesh.userData.tail;
    if (tail) {
      // 不安地甩尾
      tail.rotation.y = Math.sin(t * 7 + b.tailFlick) * 0.18;
      tail.rotation.x = Math.sin(t * 5.2 + b.tailFlick) * 0.08 - 0.05;
    }
  }

  function startConvoy(toIdx) {
    convoy.active = true;
    convoy.cooldown = 3.5 + rnd() * 2.5;
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      b.queueOrder = i;
      b.flyDelay = i * (0.11 + rnd() * 0.07);
      b.state = STATES.FLY;
      b.flyProgress = 0;
      b.perchIdx = toIdx;
      b.flyStart.copy(b.pos);
      b.target.copy(perches[toIdx]);
      b.target.x += (rnd() - 0.5) * 0.45;
      b.target.y += (rnd() - 0.5) * 0.2;
      b.target.z += (rnd() - 0.5) * 0.45;
      const dist = b.flyStart.distanceTo(b.target);
      b.flyDur = THREE.MathUtils.clamp(0.55 + dist * 0.1, 0.65, 1.6);
      b.bank = 0;
      b.pitch = 0;
      b.hangAmt = 0;
    }
  }

  function enterHop(b, rndLocal) {
    b.state = STATES.HOP;
    b.hopFrom.copy(b.pos);
    const ang = b.lookYaw + (rndLocal() - 0.5) * 1.4;
    const dist = 0.25 + rndLocal() * 0.4;
    b.hopTo.set(
      b.pos.x + Math.sin(ang) * dist,
      b.pos.y + (rndLocal() - 0.4) * 0.35,
      b.pos.z + Math.cos(ang) * dist,
    );
    const home = perches[b.perchIdx];
    if (b.hopTo.distanceTo(home) > 1.6) b.hopTo.lerp(home, 0.5);
    b.lookYaw = Math.atan2(b.hopTo.x - b.pos.x, b.hopTo.z - b.pos.z);
    b.hopT = 0;
    b.hopDur = 0.16 + rndLocal() * 0.1;
    b.hangAmt = 0;
  }

  function enterHang(b, rndLocal) {
    b.state = STATES.HANG;
    b.timer = 0.45 + rndLocal() * 0.55;
    b.hangAmt = 0;
  }

  function enterPerch(b, rndLocal) {
    b.state = STATES.PERCH;
    b.timer = 0.4 + rndLocal() * 1.6;
    b.hangAmt = 0;
    b.vel.set(0, 0, 0);
  }

  function update(t, dt = 1 / 60) {
    const dti = Math.min(dt, 0.05);

    if (!convoy.active) {
      convoy.cooldown -= dti;
      if (convoy.cooldown <= 0) {
        const lead = birds[0];
        let next = lead.perchIdx;
        for (let k = 0; k < 8; k++) {
          next = Math.floor(rnd() * perches.length);
          const d = perches[next].distanceTo(perches[lead.perchIdx]);
          // 短距过空地：仍跟飞，但不飞出山顶视野
          if (next !== lead.perchIdx && d > 1.2 && d < 6.5) break;
        }
        startConvoy(next);
      }
    }

    let flyingLeft = 0;

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];

      if (b.state === STATES.PERCH) {
        b.timer -= dti;
        b.hangAmt += (0 - b.hangAmt) * (1 - Math.exp(-6 * dti));
        setPerchPose(b, t);
        if (b.timer <= 0 && !convoy.active) {
          const r = rnd();
          if (r < 0.62) enterHop(b, rnd);
          else if (r < 0.78) enterHang(b, rnd);
          else enterPerch(b, rnd);
        }
      } else if (b.state === STATES.HOP) {
        b.hopT += dti / b.hopDur;
        const u = Math.min(1, b.hopT);
        const ease = u * u * (3 - 2 * u);
        b.pos.lerpVectors(b.hopFrom, b.hopTo, ease);
        b.pos.y += Math.sin(Math.PI * u) * 0.18;
        b.mesh.position.copy(b.pos);
        aim.position.copy(b.pos);
        aim.lookAt(b.hopTo.x, b.pos.y, b.hopTo.z);
        b.mesh.quaternion.copy(aim.quaternion);
        foldWings(b, 0.65);
        const tail = b.mesh.userData.tail;
        if (tail) tail.rotation.y = Math.sin(u * Math.PI * 2) * 0.25;
        if (u >= 1) {
          b.pos.copy(b.hopTo);
          enterPerch(b, rnd);
        }
      } else if (b.state === STATES.HANG) {
        b.timer -= dti;
        b.hangAmt += (1 - b.hangAmt) * (1 - Math.exp(-5 * dti));
        setPerchPose(b, t);
        // 倒挂时头略探向枝叶
        const head = b.mesh.userData.head;
        if (head) head.rotation.x = Math.sin(t * 8 + b.bob) * 0.15;
        if (b.timer <= 0) {
          if (head) head.rotation.x = 0;
          enterPerch(b, rnd);
        }
      } else if (b.state === STATES.FLY) {
        if (b.flyDelay > 0) {
          b.flyDelay -= dti;
          setPerchPose(b, t);
          flyingLeft++;
          continue;
        }
        flyingLeft++;
        b.flyProgress += dti / b.flyDur;
        const u = Math.min(1, b.flyProgress);
        // bounce 波状短飞
        const bounce = Math.sin(u * Math.PI * 2.2) * 0.35 + Math.sin(Math.PI * u) * 0.85;
        tmp.lerpVectors(b.flyStart, b.target, u * u * (3 - 2 * u));
        tmp.y = THREE.MathUtils.lerp(b.flyStart.y, b.target.y, u) + bounce;
        b.prevVel.copy(b.vel);
        b.vel.subVectors(tmp, b.pos).multiplyScalar(1 / Math.max(dti, 0.001));
        b.pos.copy(tmp);

        aim.position.copy(b.pos);
        const lookU = Math.min(1, u + 0.1);
        aim.lookAt(
          THREE.MathUtils.lerp(b.flyStart.x, b.target.x, lookU),
          b.pos.y + b.vel.y * 0.04,
          THREE.MathUtils.lerp(b.flyStart.z, b.target.z, lookU),
        );
        baseQ.copy(aim.quaternion);

        right.set(1, 0, 0).applyQuaternion(baseQ);
        const latAccel = b.vel.clone().sub(b.prevVel).dot(right) / Math.max(dti, 0.001);
        b.bank += (THREE.MathUtils.clamp(-latAccel * 0.04, -0.55, 0.55) - b.bank) * (1 - Math.exp(-8 * dti));
        bankQ.setFromAxisAngle(bankAxis, b.bank);
        b.pitch += (THREE.MathUtils.clamp(b.vel.y * 0.07, -0.5, 0.4) - b.pitch) * (1 - Math.exp(-7 * dti));
        pitchQ.setFromAxisAngle(pitchAxis, b.pitch);

        b.mesh.position.copy(b.pos);
        b.mesh.quaternion.copy(baseQ).multiply(bankQ).multiply(pitchQ);
        flapWings(b, t, u > 0.85 ? 0.5 : 1.15);
        const tail = b.mesh.userData.tail;
        if (tail) {
          tail.rotation.y = Math.sin(t * 10 + b.tailFlick) * 0.12;
          tail.rotation.x = -0.12;
        }
        b.lookYaw = Math.atan2(b.target.x - b.flyStart.x, b.target.z - b.flyStart.z);

        if (u >= 1) {
          b.pos.copy(b.target);
          b.vel.set(0, 0, 0);
          enterPerch(b, rnd);
          setPerchPose(b, t);
        }
      }
    }

    if (convoy.active && flyingLeft === 0) {
      convoy.active = false;
    }
  }

  flock.userData.update = update;
  return flock;
}
