import './style.css';
import * as THREE from 'three';
import { INTRO_FROM, RENDER, VIEWS } from './world/config.js';
import { Materials } from './world/geo.js';
import { buildTerrain } from './world/terrain.js';
import { createOcean } from './world/ocean.js';
import { createSky } from './world/sky.js';
import { buildForest, buildMeadow } from './world/vegetation.js';
import {
  buildBoats,
  buildDecor,
  buildLighthouse,
  buildPier,
  buildVillage,
} from './world/landmarks.js';
import { createCameraRig } from './world/camera.js';
import { formatHour } from './utils/math.js';

const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const hourSlider = document.getElementById('hourSlider');
const hourLabel = document.getElementById('hourLabel');
const enterBtn = document.getElementById('enterBtn');
const resetViewBtn = document.getElementById('resetViewBtn');

const isMobile = window.matchMedia('(max-width: 720px)').matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? RENDER.pixelRatioMobile : RENDER.pixelRatioDesktop));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#e4f1ee', 120, 520);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.5, 2000);
const rig = createCameraRig(camera, canvas);

const mats = new Materials();
const world = new THREE.Group();
scene.add(world);

buildTerrain(mats, world);
buildPier(mats, world);
buildVillage(mats, world);
buildForest(mats, world);
buildMeadow(mats, world);
const lighthouse = buildLighthouse(mats, world);
const lampPosts = buildDecor(mats, world);
const boats = buildBoats(mats, world);

const ocean = createOcean();
world.add(ocean.mesh);

const sky = createSky();
scene.add(sky.group);
scene.add(sky.clouds);
scene.add(sky.hemi);
scene.add(sky.sun);
sky.sun.shadow.mapSize.set(
  isMobile ? RENDER.shadowMapMobile : RENDER.shadowMapDesktop,
  isMobile ? RENDER.shadowMapMobile : RENDER.shadowMapDesktop,
);

const lampLights = lampPosts.slice(0, isMobile ? 2 : 5).map((p) => {
  const l = new THREE.PointLight('#ffbf73', 0, 16, 1.4);
  l.position.copy(p);
  world.add(l);
  return l;
});

let hour = 10;
let night = 0;
hourSlider.value = String(hour);
hourLabel.textContent = formatHour(hour);

function applyTime() {
  const result = sky.setHour(hour, renderer, scene);
  night = result.night;
  lighthouse.windowMat.emissiveIntensity = night * 3.2;
  lighthouse.bulbMat.emissiveIntensity = 0.2 + night * 4;
  lighthouse.beam.intensity = night * 28;
  for (const l of lampLights) l.intensity = night * 28;
}

applyTime();

function revealHud() {
  overlay.classList.add('is-hidden');
  hud.classList.add('is-visible');
  rig.setView('all');
}

enterBtn.addEventListener('click', revealHud);
resetViewBtn.addEventListener('click', () => {
  revealHud();
  rig.goHome();
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.view === 'all'));
});

hourSlider.addEventListener('input', () => {
  hour = Number(hourSlider.value);
  hourLabel.textContent = formatHour(hour);
  applyTime();
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    revealHud();
    rig.setView(chip.dataset.view);
  });
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 42 : 34;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
});

const clock = new THREE.Clock();
let autoHour = false;

// 开场：从高空缓缓落到全景
rig.state.look.set(...INTRO_FROM.look);
rig.state.dist = INTRO_FROM.dist;
rig.state.az = INTRO_FROM.az;
rig.state.tilt = INTRO_FROM.tilt;
rig.state.targetLook.set(...VIEWS.all.look);
rig.state.targetDist = VIEWS.all.dist;
rig.state.targetAz = VIEWS.all.az;
rig.state.targetTilt = VIEWS.all.tilt;
rig.state.smoothing = 1.55;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (autoHour) {
    hour = (hour + dt * 0.15) % 24;
    hourSlider.value = String(hour);
    hourLabel.textContent = formatHour(hour);
    applyTime();
  }

  rig.update(dt);
  sky.update(dt, camera);
  ocean.update(t, night, sky.sunDir);
  boats.userData.bob(t);

  // 灯塔光束缓慢扫海
  lighthouse.beam.target.position.set(
    Math.cos(t * 0.35) * 40,
    1,
    Math.sin(t * 0.35) * 40,
  );
  lighthouse.beam.target.updateMatrixWorld();

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// 首次交互后显示 HUD
let revealed = false;
const softReveal = () => {
  if (revealed) return;
  revealed = true;
  setTimeout(revealHud, 1600);
};
canvas.addEventListener('pointerdown', softReveal, { once: true });
enterBtn.addEventListener('click', () => {
  revealed = true;
});
