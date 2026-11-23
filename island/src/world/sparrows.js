import * as THREE from 'three';
import { put } from './geo.js';
import { faceFlight } from './birdOrient.js';
import { LEVEL } from './config.js';
import { seeded } from '../utils/math.js';

/**
 * 软陶树麻雀 Passer montanus
 * 参考：栗冠 + 白颊黑斑 + 黑喉；Unity/CGTrader 资产常见动作 idle / hop / peck / takeoff / short fly / land
 * Cornell / HKBWS：近人居小群觅食，地面跳跃啄食，短程飞栖
 */

const COLORS = {
  body: '#b8895e',
  belly: '#e8dfd0',
  back: '#8f6844',
  wing: '#7a5a3c',
  wingBar: '#f2ebe0',
  crown: '#a0522d',
  cheek: '#f7f2ea',
  black: '#2a2420',
  beak: '#4a5560',
  leg: '#c4a07a',
};

const STATES = {
  IDLE: 'idle',
  HOP: 'hop',
  PECK: 'peck',
  FLY: 'fly',
};

function makeSparrow(mats) {
  const bird = new THREE.Group();
  bird.userData.dynamic = true;

  // 圆润胖身，朝向本地 -Z
  const torso = put(bird, new THREE.SphereGeometry(0.28, 12, 10), mats.get(COLORS.body), 0, 0.08, 0, {
    cast: false,
  });
  torso.scale.set(0.95, 0.88, 1.35);

  const belly = put(bird, new THREE.SphereGeometry(0.22, 10, 8), mats.get(COLORS.belly), 0, -0.02, 0.02, {
    cast: false,
  });
  belly.scale.set(0.85, 0.7, 1.15);

  const back = put(bird, new THREE.SphereGeometry(0.2, 10, 8), mats.get(COLORS.back), 0, 0.14, 0.08, {
    cast: false,
  });
  back.scale.set(0.85, 0.45, 1.1);

  // 栗冠（树麻雀标志）
  put(bird, new THREE.SphereGeometry(0.175, 10, 8), mats.get(COLORS.crown), 0, 0.24, -0.3, { cast: false }).scale.set(
    1.2,
    0.75,
    1.1,
  );

  const head = put(bird, new THREE.SphereGeometry(0.17, 11, 9), mats.get(COLORS.body), 0, 0.16, -0.34, {
    cast: false,
  });
  head.scale.set(1.05, 1, 1.05);

  // 白颊 + 黑耳斑 + 黑喉
  put(bird, new THREE.SphereGeometry(0.1, 8, 7), mats.get(COLORS.cheek), 0.13, 0.145, -0.37, { cast: false }).scale.set(
    0.6,
    0.75,
    0.9,
  );
  put(bird, new THREE.SphereGeometry(0.1, 8, 7), mats.get(COLORS.cheek), -0.13, 0.145, -0.37, { cast: false }).scale.set(
    0.6,
    0.75,
    0.9,
  );
  put(bird, new THREE.SphereGeometry(0.055, 7, 6), mats.get(COLORS.black), 0.145, 0.145, -0.355, { cast: false });
  put(bird, new THREE.SphereGeometry(0.055, 7, 6), mats.get(COLORS.black), -0.145, 0.145, -0.355, { cast: false });
  put(bird, new THREE.SphereGeometry(0.07, 7, 6), mats.get(COLORS.black), 0, 0.08, -0.45, { cast: false }).scale.set(
    0.95,
    0.72,
    1.15,
  );

  const beak = put(bird, new THREE.ConeGeometry(0.055, 0.16, 6), mats.get(COLORS.beak), 0, 0.12, -0.5, {
    cast: false,
  });
  beak.rotation.x = -Math.PI / 2;

  put(bird, new THREE.SphereGeometry(0.028, 6, 5), mats.get(COLORS.black), 0.07, 0.2, -0.4, { cast: false });
  put(bird, new THREE.SphereGeometry(0.028, 6, 5), mats.get(COLORS.black), -0.07, 0.2, -0.4, { cast: false });

  const tail = put(bird, new THREE.ConeGeometry(0.14, 0.28, 5), mats.get(COLORS.wing), 0, 0.1, 0.42, {
    cast: false,
  });
  tail.rotation.x = Math.PI / 2;
  tail.scale.set(1.2, 0.35, 1);

  // 短腿
  put(bird, new THREE.CylinderGeometry(0.025, 0.03, 0.16, 5), mats.get(COLORS.leg), 0.06, -0.12, 0.02, {
    cast: false,
  });
  put(bird, new THREE.CylinderGeometry(0.025, 0.03, 0.16, 5), mats.get(COLORS.leg), -0.06, -0.12, 0.02, {
    cast: false,
  });

  function wingSide(sign) {
    const root = new THREE.Group();
    root.position.set(0.1 * sign, 0.1, -0.02);
    bird.add(root);

    const rootMesh = put(
      root,
      new THREE.BoxGeometry(0.42, 0.1, 0.28),
      mats.get(COLORS.wing, { flatShading: true }),
      0.2 * sign,
      0.02,
      0,
      { cast: false },
    );
    rootMesh.rotation.set(0.05, -0.08 * sign, 0.35 * sign);

    // 白色翼斑
    put(
      root,
      new THREE.BoxGeometry(0.18, 0.04, 0.12),
      mats.get(COLORS.wingBar, { flatShading: true }),
      0.18 * sign,
      0.06,
      0.02,
      { cast: false },
    );

    const tip = new THREE.Group();
    tip.position.set(0.4 * sign, 0.02, 0);
    root.add(tip);
    const tipMesh = put(
      tip,
      new THREE.BoxGeometry(0.28, 0.08, 0.2),
      mats.get(COLORS.back, { flatShading: true }),
      0.12 * sign,
      0.01,
      0.02,
      { cast: false },
    );
    tipMesh.scale.set(1, 0.85, 0.75);
    tipMesh.rotation.set(0.08, -0.15 * sign, 0.2 * sign);

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
  bird.userData.head = head;

  // 收翼默认姿态
  left.root.rotation.z = 0.55;
  right.root.rotation.z = -0.55;
  left.root.rotation.x = -0.35;
  right.root.rotation.x = -0.35;

  // ~0.5 m length — soft-clay tree sparrow vs ~1.5 m people
  bird.scale.setScalar(0.45);
  return bird;
}

function pickNextPerch(perches, current, rnd, occupied) {
  // 优先空闲栖点，避免多只叠在同一点
  const free = [];
  for (let i = 0; i < perches.length; i++) {
    if (i !== current && !occupied.has(i)) free.push(i);
  }
  if (free.length) return free[Math.floor(rnd() * free.length)];
  let next = current;
  for (let k = 0; k < 6; k++) {
    next = Math.floor(rnd() * perches.length);
    if (next !== current) break;
  }
  return next;
}

export function buildSparrows(mats, parent) {
  const flock = new THREE.Group();
  flock.userData.dynamic = true;
  parent.add(flock);

  const rnd = seeded(919);
  const groundY = LEVEL.grass + 0.22;

  // 夜市镜头焦点附近多放几只，其余散落村庄
  const perches = [
    new THREE.Vector3(-18.5, groundY, 20.5),
    new THREE.Vector3(-19.8, groundY, 21.2),
    new THREE.Vector3(-17.2, groundY, 19.6),
    new THREE.Vector3(-20.5, groundY, 19.0),
    new THREE.Vector3(-16.0, groundY, 21.5),
    new THREE.Vector3(-18.0, groundY, 18.2),
    new THREE.Vector3(-21.2, groundY, 21.8),
    new THREE.Vector3(-15.5, groundY, 18.8),
    new THREE.Vector3(7.2, groundY, 11.5),
    new THREE.Vector3(9.5, groundY, 8.8),
    new THREE.Vector3(5.5, groundY, 14.0),
    new THREE.Vector3(12.0, groundY, 6.5),
    new THREE.Vector3(-20.0, groundY, 11.0),
    new THREE.Vector3(14.0, groundY, -1.0),
  ];

  const COUNT = 14;
  const birds = [];
  const aim = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  const bankAxis = new THREE.Vector3(0, 0, 1);
  const pitchAxis = new THREE.Vector3(1, 0, 0);
  const bankQ = new THREE.Quaternion();
  const pitchQ = new THREE.Quaternion();
  const baseQ = new THREE.Quaternion();

  for (let i = 0; i < COUNT; i++) {
    const bird = makeSparrow(mats);
    const perchIdx = i % perches.length;
    const perch = perches[perchIdx].clone();
    perch.x += (rnd() - 0.5) * 0.9;
    perch.z += (rnd() - 0.5) * 0.9;

    const yaw = rnd() * Math.PI * 2;
    bird.position.copy(perch);
    bird.rotation.y = yaw;
    flock.add(bird);

    birds.push({
      mesh: bird,
      state: STATES.IDLE,
      timer: 0.4 + rnd() * 1.8,
      perchIdx,
      pos: perch.clone(),
      vel: new THREE.Vector3(),
      prevVel: new THREE.Vector3(),
      target: perch.clone(),
      hopFrom: new THREE.Vector3(),
      hopTo: new THREE.Vector3(),
      hopT: 0,
      hopDur: 0.28,
      flyProgress: 0,
      flyDur: 1.2,
      flyStart: new THREE.Vector3(),
      bank: 0,
      pitch: 0,
      flapPhase: rnd() * Math.PI * 2,
      flapRate: 16 + rnd() * 5,
      lookYaw: yaw,
      peckAmt: 0,
      bob: rnd() * Math.PI * 2,
    });
  }

  function foldWings(b, amount) {
    const { leftRoot, rightRoot, leftTip, rightTip } = b.mesh.userData.wings;
    leftRoot.rotation.z = THREE.MathUtils.lerp(0.12, 0.62, amount);
    rightRoot.rotation.z = THREE.MathUtils.lerp(-0.12, -0.62, amount);
    leftRoot.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amount);
    rightRoot.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amount);
    leftTip.rotation.z = THREE.MathUtils.lerp(0.05, 0.25, amount);
    rightTip.rotation.z = THREE.MathUtils.lerp(-0.05, -0.25, amount);
  }

  function flapWings(b, t, amp) {
    const { leftRoot, rightRoot, leftTip, rightTip } = b.mesh.userData.wings;
    const flap = Math.sin(t * b.flapRate + b.flapPhase) * amp;
    const tipLag = Math.sin(t * b.flapRate + b.flapPhase + 0.85) * amp * 0.55;
    leftRoot.rotation.z = flap;
    rightRoot.rotation.z = -flap;
    leftRoot.rotation.x = 0.08;
    rightRoot.rotation.x = 0.08;
    leftTip.rotation.z = tipLag;
    rightTip.rotation.z = -tipLag;
  }

  function setGroundPose(b, t) {
    b.mesh.position.copy(b.pos);
    b.mesh.position.y = groundY + Math.sin(t * 2.2 + b.bob) * 0.012;
    // lookAt：本地 -Z 朝向，与飞行姿态一致
    aim.position.copy(b.mesh.position);
    aim.lookAt(
      b.mesh.position.x + Math.sin(b.lookYaw),
      b.mesh.position.y,
      b.mesh.position.z + Math.cos(b.lookYaw),
    );
    b.mesh.quaternion.copy(aim.quaternion);
    foldWings(b, 0.85);
    const head = b.mesh.userData.head;
    if (head) head.rotation.x = -b.peckAmt * 0.9;
  }

  function enterIdle(b, rndLocal) {
    b.state = STATES.IDLE;
    b.timer = 0.6 + rndLocal() * 2.4;
    b.vel.set(0, 0, 0);
    b.peckAmt = 0;
  }

  function enterHop(b, rndLocal) {
    b.state = STATES.HOP;
    b.hopFrom.copy(b.pos);
    const ang = b.lookYaw + (rndLocal() - 0.5) * 1.2;
    const dist = 0.4 + rndLocal() * 0.65;
    // lookYaw 对应 lookAt 前方 (sin, cos) 世界方向
    b.hopTo.set(b.pos.x + Math.sin(ang) * dist, groundY, b.pos.z + Math.cos(ang) * dist);
    // 别跑太远：拉回最近栖点附近
    const home = perches[b.perchIdx];
    if (b.hopTo.distanceTo(home) > 2.4) {
      b.hopTo.lerp(home, 0.55);
      b.hopTo.y = groundY;
    }
    b.lookYaw = Math.atan2(b.hopTo.x - b.pos.x, b.hopTo.z - b.pos.z);
    b.hopT = 0;
    b.hopDur = 0.22 + rndLocal() * 0.12;
  }

  function enterPeck(b, rndLocal) {
    b.state = STATES.PECK;
    b.timer = 0.35 + rndLocal() * 0.45;
    b.peckAmt = 0;
  }

  function enterFly(b, rndLocal) {
    b.state = STATES.FLY;
    const occupied = new Set();
    for (const o of birds) {
      if (o !== b) occupied.add(o.perchIdx);
    }
    b.perchIdx = pickNextPerch(perches, b.perchIdx, rndLocal, occupied);
    b.flyStart.copy(b.pos);
    b.target.copy(perches[b.perchIdx]);
    b.target.x += (rndLocal() - 0.5) * 0.7;
    b.target.z += (rndLocal() - 0.5) * 0.7;
    b.target.y = groundY;
    const dist = b.flyStart.distanceTo(b.target);
    b.flyDur = THREE.MathUtils.clamp(0.55 + dist * 0.12, 0.7, 1.8);
    b.flyProgress = 0;
    b.prevVel.copy(b.vel);
    b.bank = 0;
    b.pitch = 0;
  }

  function update(t, dt = 1 / 60) {
    const dti = Math.min(dt, 0.05);

    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];

      if (b.state === STATES.IDLE) {
        b.timer -= dti;
        b.peckAmt += (0 - b.peckAmt) * (1 - Math.exp(-8 * dti));
        setGroundPose(b, t);
        if (b.timer <= 0) {
          const r = rnd();
          if (r < 0.42) enterHop(b, rnd);
          else if (r < 0.72) enterPeck(b, rnd);
          else enterFly(b, rnd);
        }
      } else if (b.state === STATES.HOP) {
        b.hopT += dti / b.hopDur;
        const u = Math.min(1, b.hopT);
        const ease = u * u * (3 - 2 * u);
        b.pos.lerpVectors(b.hopFrom, b.hopTo, ease);
        b.pos.y = groundY + Math.sin(Math.PI * u) * 0.14;
        b.mesh.position.copy(b.pos);
        aim.position.copy(b.pos);
        aim.lookAt(b.hopTo.x, b.pos.y, b.hopTo.z);
        b.mesh.quaternion.copy(aim.quaternion);
        // 跳跃时略抬头
        b.mesh.rotateX(-Math.sin(Math.PI * u) * 0.28);
        foldWings(b, 0.7 + Math.sin(Math.PI * u) * 0.15);
        if (u >= 1) {
          b.pos.copy(b.hopTo);
          b.pos.y = groundY;
          enterIdle(b, rnd);
        }
      } else if (b.state === STATES.PECK) {
        b.timer -= dti;
        const pulse = Math.sin((1 - Math.max(b.timer, 0) / 0.6) * Math.PI * 3);
        b.peckAmt = Math.max(0, pulse) * 0.85;
        setGroundPose(b, t);
        if (b.timer <= 0) {
          enterIdle(b, rnd);
        }
      } else if (b.state === STATES.FLY) {
        b.flyProgress += dti / b.flyDur;
        const u = Math.min(1, b.flyProgress);
        // 短程抛物起飞：起飞陡、巡航、降落
        const arc = Math.sin(Math.PI * u) * (1.1 + b.flyStart.distanceTo(b.target) * 0.08);
        tmp.lerpVectors(b.flyStart, b.target, u * u * (3 - 2 * u));
        tmp.y = groundY + arc;
        b.prevVel.copy(b.vel);
        b.vel.subVectors(tmp, b.pos).multiplyScalar(1 / Math.max(dti, 0.001));
        b.pos.copy(tmp);

        const lookAhead = Math.min(1, Math.max(u, 0.05) + 0.08);
        const lx = THREE.MathUtils.lerp(b.flyStart.x, b.target.x, lookAhead);
        const lz = THREE.MathUtils.lerp(b.flyStart.z, b.target.z, lookAhead);
        // 水平 lookAt，爬升只进 pitch，避免倒着飞
        faceFlight(aim, baseQ, b.pos, lx, lz, b.lookYaw);

        right.set(1, 0, 0).applyQuaternion(baseQ);
        const latAccel = b.vel.clone().sub(b.prevVel).dot(right) / Math.max(dti, 0.001);
        const targetBank = THREE.MathUtils.clamp(-latAccel * 0.05, -0.7, 0.7);
        b.bank += (targetBank - b.bank) * (1 - Math.exp(-7 * dti));
        bankQ.setFromAxisAngle(bankAxis, b.bank);
        const targetPitch = THREE.MathUtils.clamp(b.vel.y * 0.08, -0.55, 0.4);
        b.pitch += (targetPitch - b.pitch) * (1 - Math.exp(-6 * dti));
        pitchQ.setFromAxisAngle(pitchAxis, b.pitch);

        b.mesh.position.copy(b.pos);
        b.mesh.quaternion.copy(baseQ).multiply(bankQ).multiply(pitchQ);

        // 麻雀翅振更快，几乎不滑翔
        const landing = u > 0.82;
        flapWings(b, t, landing ? 0.55 : 1.05);
        b.lookYaw = Math.atan2(b.target.x - b.flyStart.x, b.target.z - b.flyStart.z);

        if (u >= 1) {
          b.pos.copy(b.target);
          b.pos.y = groundY;
          b.vel.set(0, 0, 0);
          enterIdle(b, rnd);
          setGroundPose(b, t);
        }
      }
    }
  }

  flock.userData.update = update;
  return flock;
}
