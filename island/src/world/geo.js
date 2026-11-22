import * as THREE from 'three';

/** 同色共享材质，降低绘制调用。 */
export class Materials {
  constructor() {
    this.cache = new Map();
    this.rock = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.92,
      metalness: 0,
    });
    this.window = new THREE.MeshStandardMaterial({
      color: '#4f6d70',
      emissive: '#ffcf87',
      emissiveIntensity: 0,
      roughness: 0.4,
      metalness: 0,
    });
    this.bulb = new THREE.MeshStandardMaterial({
      color: '#fff1d6',
      emissive: '#ffc76e',
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0,
    });
  }

  get(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    let m = this.cache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        metalness: 0,
        ...extra,
      });
      this.cache.set(key, m);
    }
    return m;
  }
}

export function put(parent, geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.dynamic) mesh.userData.dynamic = true;
  parent.add(mesh);
  return mesh;
}

/** 圆角粘土块：底面贴地。 */
export function roundedBox(w, h, d, r) {
  if (r <= 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    return g;
  }
  const bevel = r * 0.6;
  const grow = r * 0.4;
  const hw = w / 2 - grow;
  const hd = d / 2 - grow;
  const rr = Math.max(0.001, Math.min(r, hw, hd) - grow);
  const s = new THREE.Shape();
  s.moveTo(-hw + rr, -hd);
  s.lineTo(hw - rr, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + rr);
  s.lineTo(hw, hd - rr);
  s.quadraticCurveTo(hw, hd, hw - rr, hd);
  s.lineTo(-hw + rr, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - rr);
  s.lineTo(-hw, -hd + rr);
  s.quadraticCurveTo(-hw, -hd, -hw + rr, -hd);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.01, h - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: grow,
    bevelSegments: 3,
    curveSegments: 4,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

export function gableRoof(w, d, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 2,
  });
  g.translate(0, 0, -d / 2);
  return g;
}
