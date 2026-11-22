import * as THREE from 'three';
import { INTRO_FROM, VIEWS } from './config.js';

export function createCameraRig(camera, canvas) {
  const state = {
    look: new THREE.Vector3(...INTRO_FROM.look),
    dist: INTRO_FROM.dist,
    az: INTRO_FROM.az,
    tilt: INTRO_FROM.tilt,
    targetLook: new THREE.Vector3(...VIEWS.all.look),
    targetDist: VIEWS.all.dist,
    targetAz: VIEWS.all.az,
    targetTilt: VIEWS.all.tilt,
    smoothing: 1.6,
    dragging: false,
    panning: false,
    lastX: 0,
    lastY: 0,
    inertiaAz: 0,
    inertiaTilt: 0,
  };

  const offset = new THREE.Vector3();
  const panRight = new THREE.Vector3();
  const panFwd = new THREE.Vector3();

  function applyToCamera() {
    offset.set(
      Math.cos(state.tilt) * Math.sin(state.az) * state.dist,
      Math.sin(state.tilt) * state.dist,
      Math.cos(state.tilt) * Math.cos(state.az) * state.dist,
    );
    camera.position.copy(state.look).add(offset);
    camera.lookAt(state.look);
  }

  function flyTo(view, { smoothing = 4.2 } = {}) {
    const v = view || VIEWS.all;
    state.targetLook.set(...v.look);
    state.targetDist = v.dist;
    state.targetAz = v.az;
    state.targetTilt = v.tilt;
    state.smoothing = smoothing;
    state.inertiaAz = 0;
    state.inertiaTilt = 0;
  }

  function setView(name, intro = false) {
    flyTo(VIEWS[name] || VIEWS.all, { smoothing: intro ? 1.6 : 5.5 });
  }

  function goHome() {
    setView('all');
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    if (e.button === 2 || e.shiftKey) state.panning = true;
    else state.dragging = true;
    state.inertiaAz = 0;
    state.inertiaTilt = 0;
  });

  canvas.addEventListener('pointermove', (e) => {
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    if (state.dragging) {
      state.targetAz -= dx * 0.006;
      state.targetTilt = THREE.MathUtils.clamp(state.targetTilt + dy * 0.004, 0.12, 1.35);
      state.az = state.targetAz;
      state.tilt = state.targetTilt;
      state.inertiaAz = -dx * 0.08;
      state.inertiaTilt = dy * 0.05;
    } else if (state.panning) {
      panRight.set(Math.cos(state.az), 0, -Math.sin(state.az));
      panFwd.set(-Math.sin(state.az), 0, -Math.cos(state.az));
      const scale = state.dist * 0.0018;
      state.targetLook.addScaledVector(panRight, -dx * scale);
      state.targetLook.addScaledVector(panFwd, dy * scale);
      state.targetLook.y = THREE.MathUtils.clamp(state.targetLook.y, 0.5, 14);
      const flat = Math.hypot(state.targetLook.x, state.targetLook.z);
      if (flat > 85) state.targetLook.multiplyScalar(85 / flat);
      state.look.copy(state.targetLook);
    }
  });

  const endDrag = () => {
    state.dragging = false;
    state.panning = false;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const delta = THREE.MathUtils.clamp(e.deltaY, -120, 120);
      state.targetDist = THREE.MathUtils.clamp(state.targetDist * (1 + delta * 0.0014), 16, 240);
    },
    { passive: false },
  );

  function update(dt) {
    if (!state.dragging) {
      state.targetAz += state.inertiaAz * dt;
      state.targetTilt = THREE.MathUtils.clamp(state.targetTilt + state.inertiaTilt * dt, 0.12, 1.35);
      state.inertiaAz *= Math.exp(-6.3 * dt);
      state.inertiaTilt *= Math.exp(-6.3 * dt);
    }

    const k = 1 - Math.exp(-state.smoothing * dt);
    state.look.lerp(state.targetLook, k);
    state.dist += (state.targetDist - state.dist) * k;
    state.az += (state.targetAz - state.az) * k;
    state.tilt += (state.targetTilt - state.tilt) * k;
    applyToCamera();
  }

  applyToCamera();

  return { setView, flyTo, goHome, update, state };
}
