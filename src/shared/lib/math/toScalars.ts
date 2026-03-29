import type { Vector2, Vector3, Vector4, RGB, RGBA } from './types';

export function vec2ToScalars(v: Vector2): [number, number] {
  return [v.x, v.y];
}

export function vec3ToScalars(v: Vector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

export function vec4ToScalars(v: Vector4): [number, number, number, number] {
  return [v.x, v.y, v.z, v.w];
}

export function rgbToScalars(c: RGB): [number, number, number] {
  return [c.r, c.g, c.b];
}

export function rgbaToScalars(c: RGBA): [number, number, number, number] {
  return [c.r, c.g, c.b, c.a];
}

export function vec3ToVec2Scalars(v: Vector3): [number, number] {
  return [v.x, v.y];
}

export function vec4ToVec3Scalars(v: Vector4): [number, number, number] {
  return [v.x, v.y, v.z];
}

export function vec4ToVec2Scalars(v: Vector4): [number, number] {
  return [v.x, v.y];
}
