import type { Vector2, Vector3, Vector4 } from './types';

export function toVec2(x: number, y: number): Vector2 {
  return { x, y };
}

export function toVec3(x: number, y: number, z: number): Vector3 {
  return { x, y, z };
}

export function toVec4(x: number, y: number, z: number, w: number): Vector4 {
  return { x, y, z, w };
}

export function arrayToVec2(arr: [number, number]): Vector2 {
  return { x: arr[0], y: arr[1] };
}

export function arrayToVec3(arr: [number, number, number]): Vector3 {
  return { x: arr[0], y: arr[1], z: arr[2] };
}

export function arrayToVec4(arr: [number, number, number, number]): Vector4 {
  return { x: arr[0], y: arr[1], z: arr[2], w: arr[3] };
}

export function vec2ToVec3(v: Vector2, z: number = 0): Vector3 {
  return { x: v.x, y: v.y, z };
}

export function vec2ToVec4(v: Vector2, z: number = 0, w: number = 0): Vector4 {
  return { x: v.x, y: v.y, z, w };
}

export function vec3ToVec2(v: Vector3): Vector2 {
  return { x: v.x, y: v.y };
}

export function vec3ToVec4(v: Vector3, w: number = 0): Vector4 {
  return { x: v.x, y: v.y, z: v.z, w };
}

export function vec4ToVec3(v: Vector4): Vector3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function vec4ToVec2(v: Vector4): Vector2 {
  return { x: v.x, y: v.y };
}
