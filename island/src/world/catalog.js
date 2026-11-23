import * as THREE from 'three';
import { Materials, put, roundedBox, gableRoof } from './geo.js';
import { PALETTE as P } from './config.js';
import { makeSeagull } from './birds.js';
import { makeSparrow } from './sparrows.js';
import { makeLongTit } from './longTits.js';
import { makeFlowerKind, FLOWER_KINDS } from './flowers.js';
import { makeTree } from './vegetation.js';
import { makePerson } from './details.js';
import { applyAttitude, faceFlight, faceYaw } from './birdOrient.js';
import { seeded } from '../utils/math.js';

const FLOWER_LABELS = {
  daisy: '雏菊',
  tulip: '郁金香',
  poppy: '虞美人',
  bell: '风铃草',
  sunflower: '向日葵',
  clover: '三叶草',
  spike: '穗花',
};

function makeCottage(mats) {
  const g = new THREE.Group();
  put(g, roundedBox(3.2, 2.3, 3.6, 0.18), mats.get(P.wall), 0, 0, 0);
  put(g, gableRoof(3.55, 3.8, 1.35), mats.get(P.roofRed), 0, 2.25, 0);
  put(g, roundedBox(0.7, 1.55, 0.08, 0.05), mats.get(P.woodDark), 0, 0, 1.85);
  put(g, roundedBox(0.7, 0.7, 0.08, 0.05), mats.window, -0.9, 1.0, 1.85);
  put(g, roundedBox(0.7, 0.7, 0.08, 0.05), mats.window, 0.9, 1.0, 1.85);
  return g;
}

function makeBoat(mats) {
  const g = new THREE.Group();
  put(g, roundedBox(2.4, 0.55, 1.05, 0.12), mats.get(P.wall), 0, 0.2, 0);
  put(g, new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), mats.get(P.woodDark), 0, 1.3, 0);
  put(g, roundedBox(1.2, 1.6, 0.06, 0.04), mats.get('#fffaf0'), 0.15, 1.5, 0);
  return g;
}

function makeLighthouseMini(mats) {
  const g = new THREE.Group();
  put(g, new THREE.CylinderGeometry(0.55, 0.7, 4.2, 14), mats.get(P.lhWhite), 0, 2.1, 0);
  put(g, new THREE.CylinderGeometry(0.6, 0.6, 0.7, 14), mats.get(P.lhRed), 0, 1.2, 0);
  put(g, new THREE.CylinderGeometry(0.6, 0.6, 0.7, 14), mats.get(P.lhRed), 0, 3.0, 0);
  put(g, new THREE.ConeGeometry(0.75, 0.7, 14), mats.get(P.lhRed), 0, 4.6, 0);
  put(g, new THREE.SphereGeometry(0.22, 10, 8), mats.bulb, 0, 4.15, 0);
  return g;
}

function makeStall(mats) {
  const g = new THREE.Group();
  put(g, roundedBox(1.8, 0.85, 1.2, 0.1), mats.get(P.wood), 0, 0, 0);
  put(g, roundedBox(2.0, 0.08, 1.4, 0.04), mats.get(P.cloth[1]), 0, 2.05, 0);
  put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), -0.8, 1.1, -0.5);
  put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), 0.8, 1.1, -0.5);
  put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), -0.8, 1.1, 0.5);
  put(g, new THREE.CylinderGeometry(0.055, 0.065, 2.2, 6), mats.get(P.woodDark), 0.8, 1.1, 0.5);
  return g;
}

function makePalm(mats) {
  const g = new THREE.Group();
  const trunk = put(g, new THREE.CylinderGeometry(0.14, 0.22, 5.2, 7), mats.get(P.trunk), 0.15, 2.6, 0);
  trunk.rotation.z = 0.18;
  for (let i = 0; i < 6; i++) {
    const leaf = put(g, new THREE.ConeGeometry(0.35, 1.8, 5), mats.get('#4f8a64'), 0.4, 5.2, 0, { cast: false });
    leaf.rotation.z = 1.05;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
  }
  return g;
}

function makeFish(mats) {
  const g = new THREE.Group();
  const body = put(g, new THREE.ConeGeometry(0.18, 0.7, 6), mats.get(P.fish[1]), 0, 0.2, 0, { cast: false });
  body.rotation.x = Math.PI / 2;
  return g;
}

function foldSparrowWings(bird, amount) {
  const a = THREE.MathUtils.clamp(amount, 0, 1);
  const { leftRoot, rightRoot, leftTip, rightTip } = bird.userData.wings;
  leftRoot.rotation.set(-0.25 * a, 1.35 * a, -0.35 * a);
  rightRoot.rotation.set(-0.25 * a, -1.35 * a, 0.35 * a);
  leftTip.rotation.set(0.1 * a, 0.4 * a, -0.5 * a);
  rightTip.rotation.set(0.1 * a, -0.4 * a, 0.5 * a);
  const sx = THREE.MathUtils.lerp(1, 0.42, a);
  leftRoot.scale.set(sx, 0.85, THREE.MathUtils.lerp(1, 1.2, a));
  rightRoot.scale.set(sx, 0.85, THREE.MathUtils.lerp(1, 1.2, a));
}

function flapSparrowWings(bird, t, amp) {
  const { leftRoot, rightRoot, leftTip, rightTip } = bird.userData.wings;
  leftRoot.scale.set(1, 1, 1);
  rightRoot.scale.set(1, 1, 1);
  const flap = Math.sin(t * 18) * amp * 0.85;
  const tipLag = Math.sin(t * 18 + 0.85) * amp * 0.5;
  leftRoot.rotation.set(0.06, 0.1, -0.2 + flap);
  rightRoot.rotation.set(0.06, -0.1, 0.2 - flap);
  leftTip.rotation.set(0.05, 0.08, -0.1 + tipLag);
  rightTip.rotation.set(0.05, -0.08, 0.1 - tipLag);
}

function createSparrowDemo(bird) {
  let action = 'idle';
  let u = 0;
  const home = new THREE.Vector3(0, 0, 0);
  const aim = new THREE.Object3D();
  const baseQ = new THREE.Quaternion();

  return {
    setAction(id) {
      action = id;
      u = 0;
      bird.position.copy(home);
      bird.rotation.set(0, 0, 0);
      bird.quaternion.identity();
    },
    getAction: () => action,
    update(t, dt) {
      if (action === 'idle') {
        bird.position.set(0, Math.sin(t * 2.2) * 0.012, 0);
        bird.rotation.y = Math.sin(t * 0.6) * 0.15;
        foldSparrowWings(bird, 1);
        if (bird.userData.head) bird.userData.head.rotation.x = 0;
      } else if (action === 'peck') {
        bird.position.set(0, 0, 0);
        bird.rotation.y = 0;
        foldSparrowWings(bird, 1);
        const peck = Math.max(0, Math.sin(t * 9)) * 0.85;
        if (bird.userData.head) bird.userData.head.rotation.x = -peck * 0.9;
      } else if (action === 'hop') {
        u = (u + dt / 0.32) % 1;
        const ease = u * u * (3 - 2 * u);
        bird.position.set(Math.sin(ease * Math.PI) * 0.55, Math.sin(Math.PI * u) * 0.14, ease * 0.35);
        bird.rotation.y = 0.4;
        bird.rotation.x = -Math.sin(Math.PI * u) * 0.28;
        foldSparrowWings(bird, 0.9);
      } else if (action === 'fly') {
        u = (u + dt / 1.35) % 1;
        const arc = Math.sin(Math.PI * u) * 0.65;
        const x = THREE.MathUtils.lerp(-0.9, 0.9, u);
        bird.position.set(x, arc, 0);
        faceFlight(aim, baseQ, bird.position, x + 0.4, 0, 0);
        bird.quaternion.copy(baseQ);
        if (u > 0.78) foldSparrowWings(bird, (u - 0.78) / 0.22);
        else flapSparrowWings(bird, t, 1.05);
      }
    },
  };
}

function createLongTitDemo(bird) {
  let action = 'perch';
  let u = 0;
  const aim = new THREE.Object3D();
  const baseQ = new THREE.Quaternion();

  function fold(amt) {
    const { left, right } = bird.userData.wings;
    left.rotation.z = THREE.MathUtils.lerp(0.1, 0.6, amt);
    right.rotation.z = THREE.MathUtils.lerp(-0.1, -0.6, amt);
    left.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amt);
    right.rotation.x = THREE.MathUtils.lerp(0.05, -0.4, amt);
  }

  function flap(t, amp) {
    const { left, right } = bird.userData.wings;
    const f = Math.sin(t * 20) * amp;
    left.rotation.z = f;
    right.rotation.z = -f;
    left.rotation.x = 0.1;
    right.rotation.x = 0.1;
  }

  return {
    setAction(id) {
      action = id;
      u = 0;
      bird.position.set(0, 0, 0);
      bird.quaternion.identity();
      bird.rotation.set(0, 0, 0);
    },
    getAction: () => action,
    update(t, dt) {
      const tail = bird.userData.tail;
      if (action === 'perch') {
        bird.position.y = Math.sin(t * 3.5) * 0.01;
        bird.rotation.set(0, Math.sin(t * 0.7) * 0.2, 0);
        fold(0.88);
        if (tail) {
          tail.rotation.y = Math.sin(t * 7) * 0.18;
          tail.rotation.x = Math.sin(t * 5.2) * 0.08 - 0.05;
        }
      } else if (action === 'hang') {
        const hang = 0.75 + Math.sin(t * 2) * 0.1;
        faceYaw(baseQ, 0.2);
        applyAttitude(bird.quaternion, baseQ, hang * 0.55, hang * 0.85);
        fold(0.9);
        if (bird.userData.head) bird.userData.head.rotation.x = Math.sin(t * 8) * 0.15;
      } else if (action === 'hop') {
        u = (u + dt / 0.22) % 1;
        bird.position.set(Math.sin(u * Math.PI) * 0.35, Math.sin(Math.PI * u) * 0.18, u * 0.25);
        faceFlight(aim, baseQ, bird.position, bird.position.x + 0.2, bird.position.z + 0.3, 0.4);
        bird.quaternion.copy(baseQ);
        fold(0.65);
      } else if (action === 'fly') {
        u = (u + dt / 1.2) % 1;
        const bounce = Math.sin(u * Math.PI * 2.2) * 0.25 + Math.sin(Math.PI * u) * 0.7;
        const x = THREE.MathUtils.lerp(-1.0, 1.0, u);
        bird.position.set(x, bounce, 0);
        faceFlight(aim, baseQ, bird.position, x + 0.35, 0, 0);
        bird.quaternion.copy(baseQ);
        flap(t, u > 0.85 ? 0.5 : 1.15);
      }
    },
  };
}

function createSeagullDemo(bird) {
  let action = 'flap';
  const aim = new THREE.Object3D();
  const baseQ = new THREE.Quaternion();
  let ang = 0;

  return {
    setAction(id) {
      action = id;
    },
    getAction: () => action,
    update(t, dt) {
      ang += dt * 0.9;
      const r = 1.4;
      bird.position.set(Math.cos(ang) * r, 0.6 + Math.sin(t * 1.4) * 0.2, Math.sin(ang) * r);
      faceFlight(aim, baseQ, bird.position, bird.position.x - Math.sin(ang), bird.position.z + Math.cos(ang), ang + Math.PI / 2);
      bird.quaternion.copy(baseQ);

      const { leftRoot, rightRoot, leftTip, rightTip } = bird.userData.wings;
      const gliding = action === 'glide';
      const flapAmp = gliding ? 0.22 : 0.95;
      const flap = Math.sin(t * (gliding ? 4 : 9)) * flapAmp + (gliding ? -0.18 : 0.12);
      const tipLag = Math.sin(t * 9 + 0.9) * (gliding ? 0.14 : 0.55);
      leftRoot.rotation.z = flap;
      rightRoot.rotation.z = -flap;
      leftTip.rotation.z = tipLag;
      rightTip.rotation.z = -tipLag;
      leftRoot.rotation.x = gliding ? -0.16 : 0.06;
      rightRoot.rotation.x = gliding ? -0.16 : 0.06;
    },
  };
}

function createPersonDemo(mesh) {
  let action = 'idle';
  const baseY = 0;
  return {
    setAction(id) {
      action = id;
    },
    getAction: () => action,
    update(t) {
      if (action === 'idle') {
        mesh.position.y = baseY + Math.sin(t * 2.2) * 0.02;
        mesh.rotation.y = Math.sin(t * 0.7) * 0.08;
      } else {
        mesh.position.y = baseY + Math.sin(t * 5) * 0.04;
        mesh.rotation.y = t * 0.8;
      }
    },
  };
}

function buildEntries() {
  const rnd = seeded(42);
  const flowers = FLOWER_KINDS.map((name) => ({
    id: `flower-${name}`,
    category: 'flora',
    name: FLOWER_LABELS[name] || name,
    blurb: '软陶花圃里的点景花，茎叶会随风轻摇。',
    dist: 2.2,
    lookY: 0.45,
    create: (mats) => makeFlowerKind(mats, name, rnd),
    actions: [],
  }));

  return [
    {
      id: 'sparrow',
      category: 'fauna',
      name: '树麻雀',
      blurb: '夜市与村口附近的觅食小鸟。可切换停栖、跳跃、啄食与短飞。',
      dist: 2.0,
      lookY: 0.45,
      create: (mats) => makeSparrow(mats),
      actions: [
        { id: 'idle', label: '停栖' },
        { id: 'hop', label: '跳跃' },
        { id: 'peck', label: '啄食' },
        { id: 'fly', label: '短飞' },
      ],
      demo: createSparrowDemo,
    },
    {
      id: 'longtit',
      category: 'fauna',
      name: '银喉长尾山雀',
      blurb: '山顶观景亭一带的长尾小鸟。可切换停栖、倒挂、跳跃与波状飞行。',
      dist: 2.1,
      lookY: 0.4,
      create: (mats) => makeLongTit(mats),
      actions: [
        { id: 'perch', label: '停栖' },
        { id: 'hang', label: '倒挂' },
        { id: 'hop', label: '跳跃' },
        { id: 'fly', label: '波状飞' },
      ],
      demo: createLongTitDemo,
    },
    {
      id: 'seagull',
      category: 'fauna',
      name: '海鸥',
      blurb: '海岸走廊盘旋的软陶海鸥。可切换扑翼与滑翔。',
      dist: 3.2,
      lookY: 0.4,
      create: (mats) => makeSeagull(mats),
      actions: [
        { id: 'flap', label: '扑翼' },
        { id: 'glide', label: '滑翔' },
      ],
      demo: createSeagullDemo,
    },
    {
      id: 'person',
      category: 'fauna',
      name: '岛民',
      blurb: '码头与村里的软陶小人。',
      dist: 3.2,
      lookY: 0.8,
      create: (mats) => makePerson(mats, 3),
      actions: [
        { id: 'idle', label: '站立' },
        { id: 'turn', label: '转身' },
      ],
      demo: createPersonDemo,
    },
    {
      id: 'fish',
      category: 'fauna',
      name: '小鱼',
      blurb: '浅海里掠过的鱼群成员。',
      dist: 1.8,
      lookY: 0.2,
      create: (mats) => makeFish(mats),
      actions: [],
    },
    {
      id: 'tree-round',
      category: 'flora',
      name: '圆冠树',
      blurb: '草地与村边常见的软陶阔叶树。',
      dist: 5.5,
      lookY: 1.8,
      create: (mats) => makeTree(mats, 'round', rnd),
      actions: [],
    },
    {
      id: 'tree-pine',
      category: 'flora',
      name: '松树',
      blurb: '高地处的层叠针叶树。',
      dist: 5.5,
      lookY: 1.9,
      create: (mats) => makeTree(mats, 'pine', rnd),
      actions: [],
    },
    {
      id: 'tree-oak',
      category: 'flora',
      name: '橡树',
      blurb: '块状树冠的软陶老树。',
      dist: 5.5,
      lookY: 1.9,
      create: (mats) => makeTree(mats, 'oak', rnd),
      actions: [],
    },
    {
      id: 'palm',
      category: 'flora',
      name: '棕榈',
      blurb: '沙滩边的热带点景。',
      dist: 6.5,
      lookY: 2.6,
      create: (mats) => makePalm(mats),
      actions: [],
    },
    ...flowers,
    {
      id: 'cottage',
      category: 'place',
      name: '小屋',
      blurb: '村里的红瓦软陶小屋。',
      dist: 7,
      lookY: 1.6,
      create: (mats) => makeCottage(mats),
      actions: [],
    },
    {
      id: 'lighthouse',
      category: 'place',
      name: '灯塔',
      blurb: '岬角上的红白灯塔（缩略展示）。',
      dist: 8,
      lookY: 2.4,
      create: (mats) => makeLighthouseMini(mats),
      actions: [],
    },
    {
      id: 'boat',
      category: 'place',
      name: '小船',
      blurb: '港湾里的软陶小艇。',
      dist: 4.2,
      lookY: 1.0,
      create: (mats) => makeBoat(mats),
      actions: [],
    },
    {
      id: 'stall',
      category: 'place',
      name: '夜市摊',
      blurb: '西南半岛的彩色摊位。',
      dist: 4.5,
      lookY: 1.2,
      create: (mats) => makeStall(mats),
      actions: [],
    },
  ];
}

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'fauna', label: '生灵' },
  { id: 'flora', label: '花木' },
  { id: 'place', label: '景致' },
];

/** 青屿图鉴：独立 3D 预览 + 可切换动作。 */
export function createCatalog() {
  const root = document.getElementById('catalog');
  const canvas = document.getElementById('catalogCanvas');
  const listEl = document.getElementById('catalogList');
  const catsEl = document.getElementById('catalogCats');
  const titleEl = document.getElementById('catalogTitle');
  const blurbEl = document.getElementById('catalogBlurb');
  const actionsEl = document.getElementById('catalogActions');
  const closeBtn = document.getElementById('catalogClose');
  const openBtns = [document.getElementById('catalogBtn'), document.getElementById('catalogOpenBtn')].filter(Boolean);

  const entries = buildEntries();
  let category = 'all';
  let current = entries[0];
  let demo = null;
  let open = false;
  let yaw = 0.55;
  let pitch = 0.28;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const mats = new Materials();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d8ebe6');
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const stage = new THREE.Group();
  scene.add(stage);

  const hemi = new THREE.HemisphereLight('#f4fbff', '#8aa58a', 0.95);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff4e4', 1.35);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#a8d8ff', 0.35);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  const ground = put(stage, new THREE.CircleGeometry(3.2, 48), mats.get('#b7d4a8'), 0, 0, 0, {
    cast: false,
  });
  ground.rotation.x = -Math.PI / 2;

  let subject = null;

  function resize() {
    const w = canvas.clientWidth || 480;
    const h = canvas.clientHeight || 360;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function placeCamera() {
    const dist = current?.dist ?? 4;
    const lookY = current?.lookY ?? 0.8;
    const cp = Math.cos(pitch);
    camera.position.set(Math.sin(yaw) * dist * cp, lookY + Math.sin(pitch) * dist * 0.85, Math.cos(yaw) * dist * cp);
    camera.lookAt(0, lookY * 0.55, 0);
  }

  function renderList() {
    listEl.innerHTML = '';
    const items = entries.filter((e) => category === 'all' || e.category === category);
    for (const entry of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'catalog-item' + (entry.id === current.id ? ' is-active' : '');
      btn.textContent = entry.name;
      btn.addEventListener('click', () => select(entry.id));
      listEl.appendChild(btn);
    }
  }

  function renderCats() {
    catsEl.innerHTML = '';
    for (const c of CATEGORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'catalog-cat' + (c.id === category ? ' is-active' : '');
      btn.textContent = c.label;
      btn.addEventListener('click', () => {
        category = c.id;
        renderCats();
        renderList();
      });
      catsEl.appendChild(btn);
    }
  }

  function renderActions() {
    actionsEl.innerHTML = '';
    if (!current.actions?.length) {
      actionsEl.hidden = true;
      return;
    }
    actionsEl.hidden = false;
    const active = demo?.getAction?.() || current.actions[0].id;
    for (const act of current.actions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'catalog-action' + (act.id === active ? ' is-active' : '');
      btn.textContent = act.label;
      btn.addEventListener('click', () => {
        demo?.setAction(act.id);
        renderActions();
      });
      actionsEl.appendChild(btn);
    }
  }

  function select(id) {
    const entry = entries.find((e) => e.id === id) || entries[0];
    current = entry;
    titleEl.textContent = entry.name;
    blurbEl.textContent = entry.blurb;

    if (subject) {
      stage.remove(subject);
      subject.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
      });
      subject = null;
    }
    demo = null;

    subject = entry.create(mats);
    subject.position.set(0, 0, 0);
    stage.add(subject);
    if (entry.demo) {
      demo = entry.demo(subject);
      demo.setAction(entry.actions[0]?.id || 'idle');
    }
    yaw = 0.55;
    pitch = 0.28;
    renderList();
    renderActions();
    placeCamera();
  }

  function setOpen(next) {
    open = next;
    root.classList.toggle('is-open', open);
    root.setAttribute('aria-hidden', String(!open));
    if (open) {
      resize();
      placeCamera();
      renderer.render(scene, camera);
    }
  }

  openBtns.forEach((btn) => btn.addEventListener('click', () => setOpen(true)));
  closeBtn.addEventListener('click', () => setOpen(false));
  root.querySelectorAll('[data-catalog-close]').forEach((el) => {
    el.addEventListener('click', () => setOpen(false));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - lastX) * 0.008;
    pitch = THREE.MathUtils.clamp(pitch + (e.clientY - lastY) * 0.006, -0.2, 1.1);
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
  });
  canvas.addEventListener('pointercancel', () => {
    dragging = false;
  });

  window.addEventListener('resize', () => {
    if (open) resize();
  });

  renderCats();
  select(entries[0].id);

  return {
    isOpen: () => open,
    update(t, dt) {
      if (!open) return;
      demo?.update(t, dt);
      if (!dragging && current.category !== 'fauna') {
        yaw += dt * 0.25;
      }
      placeCamera();
      renderer.render(scene, camera);
    },
  };
}
