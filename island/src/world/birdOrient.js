import * as THREE from 'three';

const _flat = new THREE.Vector3();

/**
 * 水平朝向 + 本地侧倾/俯仰。
 * 不要把竖直速度喂进 lookAt：近乎垂直时会绕 up 轴翻肚（倒着飞）。
 */
export function faceFlight(aim, baseQ, pos, lookX, lookZ, fallbackYaw = 0) {
  aim.position.copy(pos);
  _flat.set(lookX - pos.x, 0, lookZ - pos.z);
  if (_flat.lengthSq() < 1e-6) {
    _flat.set(Math.sin(fallbackYaw), 0, Math.cos(fallbackYaw));
  }
  aim.lookAt(pos.x + _flat.x, pos.y, pos.z + _flat.z);
  baseQ.copy(aim.quaternion);
  return baseQ;
}
