import * as THREE from 'three';

const _flat = new THREE.Vector3();
const _eye = new THREE.Vector3();
const _target = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _mat = new THREE.Matrix4();
const _bankQ = new THREE.Quaternion();
const _pitchQ = new THREE.Quaternion();
const _fwdAxis = new THREE.Vector3(0, 0, -1);
const _rightAxis = new THREE.Vector3(1, 0, 0);

/**
 * 水平朝向（肚皮朝下）。
 *
 * 鸟模型喙在本地 -Z。不能用 Object3D.lookAt：它对非 Camera 会把 +Z 对准目标，
 * 等于倒着/倒退飞。这里用 Matrix4.lookAt(eye→target) 与相机相同，让 -Z 对准航向。
 * 竖直速度不要并进朝向，否则近乎垂直时会绕 up 翻肚。
 */
export function faceFlight(aim, baseQ, pos, lookX, lookZ, fallbackYaw = 0) {
  _flat.set(lookX - pos.x, 0, lookZ - pos.z);
  if (_flat.lengthSq() < 1e-6) {
    _flat.set(Math.sin(fallbackYaw), 0, Math.cos(fallbackYaw));
  } else {
    _flat.normalize();
  }
  _eye.copy(pos);
  _target.set(pos.x + _flat.x, pos.y, pos.z + _flat.z);
  _mat.lookAt(_eye, _target, _up);
  baseQ.setFromRotationMatrix(_mat);
  return baseQ;
}

/** 地面 / 栖枝水平朝向（与飞行同一套 -Z 朝前约定）。 */
export function faceYaw(baseQ, yaw) {
  _flat.set(Math.sin(yaw), 0, Math.cos(yaw));
  _eye.set(0, 0, 0);
  _target.copy(_flat);
  _mat.lookAt(_eye, _target, _up);
  baseQ.setFromRotationMatrix(_mat);
  return baseQ;
}

/**
 * yaw（水平）+ 本地俯仰 + 绕前轴侧倾。
 * bank/pitch 已假定在合理范围内；仍钳制避免翻肚。
 */
export function applyAttitude(outQ, baseQ, bank, pitch) {
  const b = THREE.MathUtils.clamp(bank, -0.9, 0.9);
  const p = THREE.MathUtils.clamp(pitch, -0.65, 0.55);
  _pitchQ.setFromAxisAngle(_rightAxis, p);
  _bankQ.setFromAxisAngle(_fwdAxis, b);
  outQ.copy(baseQ).multiply(_pitchQ).multiply(_bankQ);
  return outQ;
}
