import * as THREE from 'three';
import { LEVEL, VIEWS } from './config.js';
import { PEAK_TOP } from './terrain.js';

/** 可点热点：隐形碰撞球 + 镜头目标 + 介绍文案。 */
export const HOTSPOTS = [
  {
    id: 'lighthouse',
    title: '灯塔岬',
    body: '红白相间的守夜灯塔。入夜后光束扫过海面，窗里会亮起暖光。',
    position: [26.5, LEVEL.sand + 4, 2.2],
    radius: 4.2,
    view: 'cape',
  },
  {
    id: 'harbor',
    title: '港湾码头',
    body: '木栈桥伸进浅滩。渔民在此歇脚，傍晚常见小船靠岸。',
    position: [0, 2.2, 32],
    radius: 5.5,
    view: 'harbor',
  },
  {
    id: 'market',
    title: '渔港夜市',
    body: '西南半岛的软陶摊位。黄昏之后灯火最旺，布棚下摆着小岛特产。',
    position: [-18, 2.2, 21],
    radius: 6,
    view: 'market',
  },
  {
    id: 'peak',
    title: '山顶观景亭',
    body: '岩峰削出的小平台。坐在亭下可以把整座青屿收入眼底。',
    position: [-11, PEAK_TOP + 1, -12],
    radius: 5,
    view: 'peak',
  },
  {
    id: 'village',
    title: '岸边小屋',
    body: '彩顶粘土小屋围成小村子。篱笆、信箱和菜圃都是岛民日常。',
    position: [9, LEVEL.grass + 1.2, 10],
    radius: 5,
    view: {
      look: [9, 3, 10],
      dist: 38,
      az: 0.55,
      tilt: 0.42,
    },
  },
];

export function createHotspots(parent) {
  const group = new THREE.Group();
  group.name = 'hotspots';
  parent.add(group);

  const geo = new THREE.SphereGeometry(1, 12, 10);
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const meshes = HOTSPOTS.map((spot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...spot.position);
    m.scale.setScalar(spot.radius);
    m.userData.hotspot = spot;
    group.add(m);
    return m;
  });

  return { group, meshes };
}

export function createPicker(camera, canvas, meshes, { onPick, onMiss, clickSlop = 8 } = {}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;
  let downT = 0;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    downX = e.clientX;
    downY = e.clientY;
    downT = performance.now();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 0) return;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (Math.hypot(dx, dy) > clickSlop) return;
    if (performance.now() - downT > 500) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length) {
      onPick?.(hits[0].object.userData.hotspot);
    } else {
      onMiss?.();
    }
  });
}

export function resolveView(spot) {
  if (typeof spot.view === 'string') return VIEWS[spot.view] || VIEWS.all;
  return spot.view;
}
