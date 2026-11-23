import * as THREE from 'three';
import { faceFlight } from './birdOrient.js';
import { put } from './geo.js';
import { seeded } from '../utils/math.js';

/**
 * 软陶海鸥（参考 boids 扑翼 / tinyflock 扑滑交替 / three.js bird bank）
 * - 头、喙、躯干、扇尾 + 两段翼
 * - 翼尖滞后扑打；扑翼与滑翔切换
 * - 海岸走廊 + 小群分离/对齐/聚合；转弯侧倾、爬升俯仰
 */

const COLORS = {
  body: '#f7f2ea',
  belly: '#fffaf3',
  wing: '#cfc7bb',
  wingTip: '#9a948a',
  beak: '#e9a43a',
  eye: '#2a3036',
  cap: '#6e6860',
};

export function makeSeagull(mats) {
  const bird = new THREE.Group();
  bird.userData.dynamic = true;

  // 躯干沿本地 -Z
  const torso = put(bird, new THREE.SphereGeometry(0.42, 14, 11), mats.get(COLORS.body), 0, 0, 0, {
    cast: false,
  });
  torso.scale.set(0.9, 0.82, 1.65);

  const belly = put(bird, new THREE.SphereGeometry(0.34, 12, 9), mats.get(COLORS.belly), 0, -0.12, 0.05, {
    cast: false,
  });
  belly.scale.set(0.78, 0.55, 1.2);

  // 头顶深色一抹，远处更好认
  put(bird, new THREE.SphereGeometry(0.2, 10, 8), mats.get(COLORS.cap), 0, 0.2, -0.48, { cast: false }).scale.set(
    1.05,
    0.55,
    1.1,
  );

  const head = put(bird, new THREE.SphereGeometry(0.22, 12, 9), mats.get(COLORS.body), 0, 0.1, -0.58, {
    cast: false,
  });
  head.scale.set(1.05, 1, 1.1);

  const beak = put(bird, new THREE.ConeGeometry(0.08, 0.32, 7), mats.get(COLORS.beak), 0, 0.04, -0.84, {
    cast: false,
  });
  beak.rotation.x = -Math.PI / 2;

  put(bird, new THREE.SphereGeometry(0.04, 7, 6), mats.get(COLORS.eye), 0.11, 0.16, -0.66, { cast: false });
  put(bird, new THREE.SphereGeometry(0.04, 7, 6), mats.get(COLORS.eye), -0.11, 0.16, -0.66, { cast: false });

  const tail = put(bird, new THREE.ConeGeometry(0.3, 0.5, 6), mats.get(COLORS.wing), 0, 0.03, 0.7, {
    cast: false,
  });
  tail.rotation.x = Math.PI / 2;
  tail.scale.set(1.55, 0.4, 1);

  function wingSide(sign) {
    const root = new THREE.Group();
    root.position.set(0.16 * sign, 0.05, -0.02);
    bird.add(root);

    // 软陶厚翼：根段略鼓、尖端收窄并偏灰
    const rootMesh = put(
      root,
      new THREE.BoxGeometry(1.05, 0.2, 0.52),
      mats.get(COLORS.wing, { flatShading: true }),
      0.48 * sign,
      0.05,
      0,
      { cast: false },
    );
    rootMesh.scale.set(1, 1, 1);
    rootMesh.rotation.set(0.04, -0.1 * sign, 0.2 * sign);

    const tip = new THREE.Group();
    tip.position.set(1.0 * sign, 0.06, 0);
    root.add(tip);
    const tipMesh = put(
      tip,
      new THREE.BoxGeometry(0.78, 0.15, 0.38),
      mats.get(COLORS.wingTip, { flatShading: true }),
      0.34 * sign,
      0.02,
      0.05,
      { cast: false },
    );
    tipMesh.scale.set(1, 0.85, 0.72);
    tipMesh.rotation.set(0.1, -0.28 * sign, 0.12 * sign);

    return { root, tip };
  }

  const left = wingSide(-1);
  const right = wingSide(1);
  bird.userData.wings = {
    leftRoot: left.root,
    rightRoot: right.root,
    leftTip: left.tip,
    rightTip: right.tip,
  };

  // ~1.1 m body / ~2.2 m span — soft-clay gull, clearly smaller than cottages
  bird.scale.setScalar(0.55);
  return bird;
}

function clampVec(v, max) {
  const len = v.length();
  if (len > max && len > 0) v.multiplyScalar(max / len);
  return v;
}

export function buildBirds(mats, parent) {
  const flock = new THREE.Group();
  flock.userData.dynamic = true;
  parent.add(flock);

  const rnd = seeded(404);
  const COUNT = 14;
  const birds = [];
  const aim = new THREE.Object3D();

  for (let i = 0; i < COUNT; i++) {
    const bird = makeSeagull(mats);
    const groupId = i < 8 ? 0 : 1;
    const baseR = groupId === 0 ? 34 + rnd() * 9 : 46 + rnd() * 11;
    const baseH = groupId === 0 ? 10 + rnd() * 5 : 17 + rnd() * 7;
    const ang = (i / (groupId === 0 ? 8 : 6)) * Math.PI * 2 + rnd() * 0.35;

    const pos = new THREE.Vector3(Math.cos(ang) * baseR, baseH, Math.sin(ang) * baseR);
    const tangent = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize();
    const speed = 5.2 + rnd() * 2.8 + groupId * 1.1;
    const vel = tangent.multiplyScalar(speed);

    bird.position.copy(pos);
    flock.add(bird);

    birds.push({
      mesh: bird,
      pos,
      vel,
      prevVel: vel.clone(),
      groupId,
      homeR: baseR,
      homeH: baseH,
      flapPhase: rnd() * Math.PI * 2,
      flapRate: 7.8 + rnd() * 2.8,
      modeT: rnd() * 3,
      gliding: rnd() > 0.5,
      bank: 0,
      pitch: 0,
    });
  }

  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  const steer = new THREE.Vector3();
  const home = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const bankAxis = new THREE.Vector3(0, 0, 1);
  const pitchAxis = new THREE.Vector3(1, 0, 0);
  const bankQ = new THREE.Quaternion();
  const pitchQ = new THREE.Quaternion();
  const baseQ = new THREE.Quaternion();

  const SEP_DIST = 4.2;
  const ALI_DIST = 9.5;
  const COH_DIST = 12.5;
  const MAX_FORCE = 15;
  const MAX_SPEED = 11.5;
  const MIN_SPEED = 4;

  function update(t, dt = 1 / 60) {
    const dti = Math.min(dt, 0.05);

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      sep.set(0, 0, 0);
      ali.set(0, 0, 0);
      coh.set(0, 0, 0);
      let sepN = 0;
      let aliN = 0;
      let cohN = 0;

      for (let j = 0; j < birds.length; j++) {
        if (i === j) continue;
        const o = birds[j];
        if (o.groupId !== b.groupId) continue;
        const d = b.pos.distanceTo(o.pos);
        if (d < SEP_DIST && d > 0.001) {
          steer.subVectors(b.pos, o.pos).normalize().divideScalar(d);
          sep.add(steer);
          sepN++;
        }
        if (d < ALI_DIST) {
          ali.add(o.vel);
          aliN++;
        }
        if (d < COH_DIST) {
          coh.add(o.pos);
          cohN++;
        }
      }

      steer.set(0, 0, 0);
      if (sepN) {
        sep.divideScalar(sepN).normalize().multiplyScalar(MAX_SPEED).sub(b.vel);
        clampVec(sep, MAX_FORCE);
        // 分离略强于聚合，避免长时间后挤成一点
        steer.addScaledVector(sep, 1.85);
      }
      if (aliN) {
        ali.divideScalar(aliN).normalize().multiplyScalar(MAX_SPEED).sub(b.vel);
        clampVec(ali, MAX_FORCE);
        steer.addScaledVector(ali, 0.85);
      }
      if (cohN) {
        coh.divideScalar(cohN).sub(b.pos).normalize().multiplyScalar(MAX_SPEED).sub(b.vel);
        clampVec(coh, MAX_FORCE);
        steer.addScaledVector(coh, 0.55);
      }

      const flatR = Math.hypot(b.pos.x, b.pos.z);
      const desiredR = b.homeR + Math.sin(t * 0.32 + b.flapPhase) * 4;
      const radial = (desiredR - flatR) * 0.95;
      home.set(b.pos.x, 0, b.pos.z).normalize().multiplyScalar(radial);
      forward.set(-b.pos.z, 0, b.pos.x).normalize().multiplyScalar(2.4);
      home.add(forward);
      const desiredH = b.homeH + Math.sin(t * 0.5 + b.flapPhase * 0.7) * 2.8;
      home.y = (desiredH - b.pos.y) * 1.7;
      clampVec(home, MAX_FORCE);
      steer.add(home);

      b.prevVel.copy(b.vel);
      b.vel.addScaledVector(steer, dti);
      const spd = b.vel.length();
      if (spd > MAX_SPEED) b.vel.multiplyScalar(MAX_SPEED / spd);
      if (spd < MIN_SPEED && spd > 0) b.vel.multiplyScalar(MIN_SPEED / spd);
      b.pos.addScaledVector(b.vel, dti);
      // 别钻进海里
      if (b.pos.y < 4.5) {
        b.pos.y = 4.5;
        if (b.vel.y < 0) b.vel.y *= -0.35;
      }
      b.mesh.position.copy(b.pos);

      // 水平朝向；爬升由 pitch 单独处理，避免陡升时 lookAt 翻肚
      faceFlight(aim, baseQ, b.pos, b.pos.x + b.vel.x, b.pos.z + b.vel.z, Math.atan2(b.vel.x, b.vel.z));

      right.set(1, 0, 0).applyQuaternion(baseQ);
      const latAccel = b.vel.clone().sub(b.prevVel).dot(right) / Math.max(dti, 0.001);
      const targetBank = THREE.MathUtils.clamp(-latAccel * 0.09, -0.85, 0.85);
      b.bank += (targetBank - b.bank) * (1 - Math.exp(-6.5 * dti));
      bankQ.setFromAxisAngle(bankAxis, b.bank);

      const targetPitch = THREE.MathUtils.clamp(b.vel.y * 0.14, -0.5, 0.45);
      b.pitch += (targetPitch - b.pitch) * (1 - Math.exp(-5.5 * dti));
      pitchQ.setFromAxisAngle(pitchAxis, b.pitch);

      b.mesh.quaternion.copy(baseQ).multiply(bankQ).multiply(pitchQ);

      b.modeT -= dti;
      if (b.modeT <= 0) {
        b.gliding = !b.gliding;
        const jitter = 0.5 + 0.5 * Math.sin(b.flapPhase * 5.1 + t);
        b.modeT = b.gliding ? 1.0 + jitter * 2.2 : 0.55 + jitter * 1.35;
      }

      const climbBoost = Math.max(0, -b.vel.y * 0.1);
      const flapAmp = b.gliding ? 0.22 + climbBoost : 0.95;
      const flap = Math.sin(t * b.flapRate + b.flapPhase) * flapAmp + (b.gliding ? -0.18 : 0.12);
      const tipLag = Math.sin(t * b.flapRate + b.flapPhase + 0.9) * (b.gliding ? 0.14 : 0.55);

      const { leftRoot, rightRoot, leftTip, rightTip } = b.mesh.userData.wings;
      leftRoot.rotation.z = flap;
      rightRoot.rotation.z = -flap;
      leftTip.rotation.z = tipLag;
      rightTip.rotation.z = -tipLag;
      leftRoot.rotation.x = b.gliding ? -0.16 : 0.06;
      rightRoot.rotation.x = b.gliding ? -0.16 : 0.06;
    }
  }

  flock.userData.update = update;
  return flock;
}
