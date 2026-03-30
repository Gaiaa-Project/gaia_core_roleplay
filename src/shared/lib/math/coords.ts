import type { Vector3 } from './types';

const DEG_TO_RAD = Math.PI / 180;

export function getRelativeCoords(coords: Vector3, heading: number, offset: Vector3): Vector3 {
  const rad = heading * DEG_TO_RAD;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);

  return {
    x: coords.x + offset.x * cos - offset.y * sin,
    y: coords.y + offset.x * sin + offset.y * cos,
    z: coords.z + offset.z,
  };
}

export function getRelativeCoords3D(coords: Vector3, rotation: Vector3, offset: Vector3): Vector3 {
  const pitch = rotation.x * DEG_TO_RAD;
  const roll = rotation.y * DEG_TO_RAD;
  const yaw = rotation.z * DEG_TO_RAD;

  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const sr = Math.sin(roll);
  const cr = Math.cos(roll);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);

  return {
    x:
      coords.x +
      offset.x * (cy * cr) +
      offset.y * (cy * sr * sp - sy * cp) +
      offset.z * (cy * sr * cp + sy * sp),
    y:
      coords.y +
      offset.x * (sy * cr) +
      offset.y * (sy * sr * sp + cy * cp) +
      offset.z * (sy * sr * cp - cy * sp),
    z: coords.z + offset.x * -sr + offset.y * (cr * sp) + offset.z * (cr * cp),
  };
}
