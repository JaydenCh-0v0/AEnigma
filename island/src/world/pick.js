import * as THREE from 'three';
import { LEVEL, VIEWS } from './config.js';
import { PEAK_TOP } from './terrain.js';

/** 可点热点：碰撞球 + 可见浮标 + 镜头目标 + 介绍文案。 */
export const HOTSPOTS = [
  {
    id: 'lighthouse',
    title: '灯塔岬',
    body: '红白相间的守夜灯塔。入夜后光束扫过海面，窗里会亮起暖光。',
    position: [26.5, LEVEL.sand + 4, 2.2],
    marker: [26.5, LEVEL.sand + 9.8, 2.2],
    radius: 4.2,
    view: 'cape',
  },
  {
    id: 'harbor',
    title: '港湾码头',
    body: '木栈桥伸进浅滩。渔民在此歇脚，傍晚常见小船靠岸。',
    position: [0, 2.2, 32],
    marker: [0, 4.2, 34],
    radius: 5.5,
    view: 'harbor',
  },
  {
    id: 'market',
    title: '渔港夜市',
    body: '西南半岛的软陶摊位。黄昏之后灯火最旺，布棚下摆着小岛特产。',
    position: [-18, 2.2, 21],
    marker: [-18, 4.6, 21],
    radius: 6,
    view: 'market',
  },
  {
    id: 'peak',
    title: '山顶观景亭',
    body: '岩峰削出的小平台。坐在亭下可以把整座青屿收入眼底。',
    position: [-11, PEAK_TOP + 1, -12],
    marker: [-11, PEAK_TOP + 4.2, -12],
    radius: 5,
    view: 'peak',
  },
  {
    id: 'village',
    title: '岸边小屋',
    body: '彩顶粘土小屋围成小村子。篱笆、信箱和菜圃都是岛民日常。',
    position: [9, LEVEL.grass + 1.2, 10],
    marker: [9, LEVEL.grass + 4.8, 10],
    radius: 5,
    view: {
      look: [9, 3, 10],
      dist: 38,
      az: 0.55,
      tilt: 0.42,
    },
  },
];

function makeMarker() {
  const g = new THREE.Group();
  g.userData.dynamic = true;

  const ringMat = new THREE.MeshBasicMaterial({
    color: '#35d2cb',
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: '#fff8e8',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const stemMat = new THREE.MeshBasicMaterial({
    color: '#35d2cb',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 8, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), coreMat);
  g.add(core);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), stemMat);
  stem.position.y = -1.2;
  g.add(stem);

  g.userData.ring = ring;
  g.userData.core = core;
  g.userData.mats = [ringMat, coreMat, stemMat];
  return g;
}

export function createHotspots(parent) {
  const group = new THREE.Group();
  group.name = 'hotspots';
  parent.add(group);

  const hitGeo = new THREE.SphereGeometry(1, 12, 10);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const markers = [];
  const meshes = HOTSPOTS.map((spot) => {
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.set(...spot.position);
    hit.scale.setScalar(spot.radius);
    hit.userData.hotspot = spot;
    group.add(hit);

    const marker = makeMarker();
    marker.position.set(...(spot.marker || spot.position));
    marker.userData.hotspot = spot;
    marker.userData.baseY = marker.position.y;
    group.add(marker);
    markers.push(marker);

    // 标记也可点
    const markerHit = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 10, 8),
      hitMat,
    );
    markerHit.position.copy(marker.position);
    markerHit.userData.hotspot = spot;
    group.add(markerHit);

    return hit;
  });

  // 合并可点对象：碰撞球 + 标记附近
  const pickables = [];
  group.traverse((o) => {
    if (o.isMesh && o.userData.hotspot) pickables.push(o);
  });

  return {
    group,
    meshes: pickables,
    markers,
    update(t, activeId = null) {
      markers.forEach((m, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + i);
        m.position.y = m.userData.baseY + Math.sin(t * 1.8 + i) * 0.25;
        m.userData.ring.scale.setScalar(0.9 + pulse * 0.35);
        const on = activeId && m.userData.hotspot.id === activeId;
        m.userData.mats[0].color.set(on ? '#ffcf87' : '#35d2cb');
        m.userData.mats[0].opacity = on ? 0.95 : 0.55 + pulse * 0.3;
        m.userData.core.scale.setScalar(on ? 1.35 : 1);
      });
    },
    setVisible(v) {
      markers.forEach((m) => {
        m.visible = v;
      });
    },
  };
}

export function createPicker(camera, canvas, meshes, { onPick, onMiss, onHover, clickSlop = 8 } = {}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;
  let downT = 0;

  function setPointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    downX = e.clientX;
    downY = e.clientY;
    downT = performance.now();
  });

  canvas.addEventListener('pointermove', (e) => {
    setPointerFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    const spot = hits[0]?.object?.userData?.hotspot || null;
    onHover?.(spot);
    canvas.style.cursor = spot ? 'pointer' : '';
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 0) return;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    if (Math.hypot(dx, dy) > clickSlop) return;
    if (performance.now() - downT > 500) return;

    setPointerFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length) onPick?.(hits[0].object.userData.hotspot);
    else onMiss?.();
  });
}

export function resolveView(spot) {
  if (typeof spot.view === 'string') return VIEWS[spot.view] || VIEWS.all;
  return spot.view;
}
