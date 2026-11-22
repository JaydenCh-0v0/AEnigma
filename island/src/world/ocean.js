import * as THREE from 'three';
import { PALETTE as P, SEA_LEVEL } from './config.js';
import { shoreDistance } from './terrain.js';

const EXTENT = 110;
const TEX_SIZE = 256;
const MAX_DIST = 40;

const WAVES = /* glsl */ `
vec2 waveD(vec2 p, float t){
  float w1 = sin(p.x * 0.18 + t * 1.1) * cos(p.y * 0.14 - t * 0.85);
  float w2 = sin(p.x * 0.31 - t * 0.7 + p.y * 0.22) * 0.45;
  float hx = cos(p.x * 0.18 + t * 1.1) * 0.18 * cos(p.y * 0.14 - t * 0.85)
           + cos(p.x * 0.31 - t * 0.7 + p.y * 0.22) * 0.31 * 0.45;
  float hz = -sin(p.x * 0.18 + t * 1.1) * sin(p.y * 0.14 - t * 0.85) * 0.14
           + cos(p.x * 0.31 - t * 0.7 + p.y * 0.22) * 0.22 * 0.45;
  return vec2(hx, hz) * 0.55;
}
float waveH(vec2 p, float t){
  return sin(p.x * 0.18 + t * 1.1) * cos(p.y * 0.14 - t * 0.85) * 0.22
       + sin(p.x * 0.31 - t * 0.7 + p.y * 0.22) * 0.1;
}
`;

function shoreTexture() {
  const data = new Uint8Array(TEX_SIZE * TEX_SIZE);
  for (let j = 0; j < TEX_SIZE; j++) {
    for (let i = 0; i < TEX_SIZE; i++) {
      const x = ((i + 0.5) / TEX_SIZE) * 2 * EXTENT - EXTENT;
      const z = ((j + 0.5) / TEX_SIZE) * 2 * EXTENT - EXTENT;
      const d = Math.min(MAX_DIST, Math.max(0, shoreDistance(x, z)));
      data[j * TEX_SIZE + i] = Math.round((d / MAX_DIST) * 255);
    }
  }
  const t = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RedFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

export function createOcean() {
  const uniforms = {
    uTime: { value: 0 },
    uNight: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uShore: { value: shoreTexture() },
    uExtent: { value: EXTENT },
    uShallow: { value: new THREE.Color(P.seaShallow) },
    uMid: { value: new THREE.Color(P.seaMid) },
    uDeep: { value: new THREE.Color(P.seaDeep) },
    uFoam: { value: new THREE.Color(P.foam) },
    uSand: { value: new THREE.Color(P.seabed) },
  };

  const mat = new THREE.MeshStandardMaterial({
    color: P.seaMid,
    roughness: 0.18,
    metalness: 0.05,
    transparent: true,
    opacity: 0.96,
  });

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uTime; varying vec3 vWPos; varying float vShore;\n${WAVES}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `vec2 wd = waveD(position.xz, uTime);\nvec3 objectNormal = normalize(vec3(-wd.x, 1.0, -wd.y));`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = position;\ntransformed.y += waveH(position.xz, uTime);\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uNight;
uniform vec3 uSunDir;
uniform sampler2D uShore;
uniform float uExtent;
uniform vec3 uShallow;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform vec3 uSand;
varying vec3 vWPos;`,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `float dist = texture2D(uShore, vWPos.xz / (2.0 * uExtent) + 0.5).r * ${MAX_DIST.toFixed(1)};
float depth = clamp(dist / 18.0, 0.0, 1.0);
vec3 water = mix(uShallow, uMid, smoothstep(0.0, 0.35, depth));
water = mix(water, uDeep, smoothstep(0.25, 1.0, depth));
float foam = 1.0 - smoothstep(0.15, 1.8, dist);
foam *= 0.55 + 0.45 * sin(vWPos.x * 2.2 + vWPos.z * 1.7 + uTime * 2.4);
vec3 bed = mix(uSand, water, smoothstep(0.0, 2.2, dist));
vec3 col = mix(bed, water, smoothstep(0.0, 0.9, dist));
col = mix(col, uFoam, clamp(foam, 0.0, 1.0) * (1.0 - uNight * 0.35));
float fres = pow(1.0 - max(dot(normalize(vWPos - cameraPosition), vec3(0.0, 1.0, 0.0)), 0.0), 2.5);
col = mix(col, mix(uMid, uDeep, 0.4), fres * 0.22);
float spark = pow(max(dot(normalize(reflect(normalize(vWPos - cameraPosition), vec3(0.,1.,0.))), normalize(uSunDir)), 0.), 80.0);
col += vec3(1.0, 0.96, 0.88) * spark * (1.0 - uNight) * 0.55;
vec4 diffuseColor = vec4(col, opacity);`,
      );
  };

  const geo = new THREE.PlaneGeometry(900, 900, 180, 180);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = SEA_LEVEL;
  mesh.receiveShadow = true;
  mesh.userData.dynamic = true;

  return {
    mesh,
    update(t, night, sunDir) {
      uniforms.uTime.value = t;
      uniforms.uNight.value = night;
      uniforms.uSunDir.value.copy(sunDir).normalize();
    },
  };
}
