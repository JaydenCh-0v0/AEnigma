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
import {
  animateFlags,
  animateSway,
  buildBeach,
  buildBirds,
  buildSparrows,
  buildLongTits,
  buildFireflies,
  buildFishSchools,
  buildHomeExtras,
  buildMarket,
  buildPeople,
  buildProps,
  buildReef,
  buildSmoke,
} from './world/details.js';
import { createCameraRig } from './world/camera.js';
import { createPostFX } from './world/postfx.js';
import { createHotspots, createPicker, resolveView } from './world/pick.js';
import { createAmbient } from './world/ambient.js';
import { formatHour } from './utils/math.js';

const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const hourSlider = document.getElementById('hourSlider');
const hourLabel = document.getElementById('hourLabel');
const enterBtn = document.getElementById('enterBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const spotCard = document.getElementById('spotCard');
const spotTitle = document.getElementById('spotTitle');
const spotBody = document.getElementById('spotBody');
const spotClose = document.getElementById('spotClose');
const autoHourBtn = document.getElementById('autoHourBtn');
const soundBtn = document.getElementById('soundBtn');
const markersBtn = document.getElementById('markersBtn');

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
buildHomeExtras(mats, world);
buildMarket(mats, world);
buildForest(mats, world);
buildMeadow(mats, world);
buildBeach(mats, world);
buildReef(mats, world);
buildProps(mats, world);
const lighthouse = buildLighthouse(mats, world);
const lampPosts = buildDecor(mats, world);
const boats = buildBoats(mats, world);
const people = buildPeople(mats, world);
const birds = buildBirds(mats, world);
const sparrows = buildSparrows(mats, world);
const longTits = buildLongTits(mats, world);
const fish = buildFishSchools(mats, world);
const fireflies = buildFireflies(world);
const smoke = buildSmoke(world);
const hotspots = createHotspots(world);

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

const postfx = createPostFX(renderer, scene, camera, { lite: isMobile });
const ambient = createAmbient();

const lampLights = lampPosts.slice(0, isMobile ? 3 : 8).map((p) => {
  const l = new THREE.PointLight('#ffbf73', 0, 16, 1.4);
  l.position.copy(p);
  world.add(l);
  return l;
});

const marketLight = new THREE.PointLight('#ffbf73', 0, 22, 1.3);
marketLight.position.set(-18, 3.2, 22);
world.add(marketLight);

let hour = 10;
let night = 0;
let autoHour = false;
let activeSpotId = null;
hourSlider.value = String(hour);
hourLabel.textContent = formatHour(hour);

function applyTime() {
  const result = sky.setHour(hour, renderer, scene);
  night = result.night;
  lighthouse.windowMat.emissiveIntensity = night * 3.2;
  lighthouse.bulbMat.emissiveIntensity = 0.25 + night * 4.2;
  lighthouse.beam.intensity = night * 28;
  for (const l of lampLights) l.intensity = night * 28;
  marketLight.intensity = night * 22;
  mats.bulb.emissiveIntensity = 0.2 + night * 3.8;
  postfx.setNight(night);
  ambient.setNight(night);
}

applyTime();

function setActiveChip(viewName) {
  document.querySelectorAll('.view-chips .chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.view === viewName);
  });
}

function showSpot(spot) {
  activeSpotId = spot.id;
  spotTitle.textContent = spot.title;
  spotBody.textContent = spot.body;
  spotCard.hidden = false;
  requestAnimationFrame(() => spotCard.classList.add('is-visible'));
}

function hideSpot() {
  activeSpotId = null;
  spotCard.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!spotCard.classList.contains('is-visible')) spotCard.hidden = true;
  }, 280);
}

function revealHud() {
  overlay.classList.add('is-hidden');
  hud.classList.add('is-visible');
}

function focusSpot(spot) {
  revealHud();
  const view = resolveView(spot);
  rig.flyTo(view, { smoothing: 4.4 });
  if (typeof spot.view === 'string') setActiveChip(spot.view);
  else setActiveChip('');
  showSpot(spot);
}

enterBtn.addEventListener('click', () => {
  revealHud();
  rig.setView('all');
  setActiveChip('all');
  hideSpot();
});

resetViewBtn.addEventListener('click', () => {
  revealHud();
  rig.goHome();
  setActiveChip('all');
  hideSpot();
});

spotClose.addEventListener('click', hideSpot);

hourSlider.addEventListener('input', () => {
  autoHour = false;
  autoHourBtn.classList.remove('active');
  autoHourBtn.setAttribute('aria-pressed', 'false');
  hour = Number(hourSlider.value);
  hourLabel.textContent = formatHour(hour);
  applyTime();
});

autoHourBtn.addEventListener('click', () => {
  autoHour = !autoHour;
  autoHourBtn.classList.toggle('active', autoHour);
  autoHourBtn.setAttribute('aria-pressed', String(autoHour));
});

soundBtn.addEventListener('click', async () => {
  const on = await ambient.toggle();
  soundBtn.classList.toggle('active', on);
  soundBtn.setAttribute('aria-pressed', String(on));
});

markersBtn.addEventListener('click', () => {
  const next = markersBtn.getAttribute('aria-pressed') !== 'true';
  markersBtn.setAttribute('aria-pressed', String(next));
  markersBtn.classList.toggle('active', next);
  hotspots.setVisible(next);
});
markersBtn.classList.add('active');

document.querySelectorAll('.view-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    setActiveChip(chip.dataset.view);
    revealHud();
    rig.setView(chip.dataset.view);
    const match = ['harbor', 'market', 'cape', 'peak'].includes(chip.dataset.view)
      ? hotspots.markers.find((m) => m.userData.hotspot.view === chip.dataset.view)
      : null;
    if (match) showSpot(match.userData.hotspot);
    else hideSpot();
  });
});

createPicker(camera, canvas, hotspots.meshes, {
  onPick: focusSpot,
  onMiss: () => {},
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 42 : 34;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  postfx.setSize(w, h);
});

const clock = new THREE.Clock();

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
    hour = (hour + dt * 0.25) % 24;
    hourSlider.value = String(hour);
    hourLabel.textContent = formatHour(hour);
    applyTime();
  }

  rig.update(dt);
  sky.update(dt, camera);
  ocean.update(t, night, sky.sunDir);
  boats.userData.bob(t);
  people.userData.update(t);
  birds.userData.update(t, dt);
  sparrows.userData.update(t, dt);
  longTits.userData.update(t, dt);
  fish.userData.update(t);
  fireflies.update(t, night);
  smoke.userData.update(t);
  hotspots.update(t, activeSpotId);
  animateFlags(world, t);
  animateSway(world, t);

  world.traverse((o) => {
    if (o.userData.flame) {
      const f = o.userData.flame;
      f.scale.setScalar(0.85 + Math.sin(t * 9) * 0.15);
      f.material.emissiveIntensity = 0.6 + Math.sin(t * 11) * 0.35;
      f.visible = night > 0.25;
    }
  });

  lighthouse.beam.target.position.set(Math.cos(t * 0.35) * 40, 1, Math.sin(t * 0.35) * 40);
  lighthouse.beam.target.updateMatrixWorld();

  postfx.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

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
