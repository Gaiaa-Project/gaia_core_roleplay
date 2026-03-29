import type { Vector2, Vector3, Vector4, InterpolationState } from './types';

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isVec2(v: unknown): v is Vector2 {
  return isRecord(v) && 'x' in v && 'y' in v && typeof v.x === 'number' && typeof v.y === 'number';
}

function isVec3(v: unknown): v is Vector3 {
  return isVec2(v) && 'z' in v && typeof (v as Record<string, unknown>).z === 'number';
}

function isVec4(v: unknown): v is Vector4 {
  return isVec3(v) && 'w' in v && typeof (v as Record<string, unknown>).w === 'number';
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

export function lerpVec2(a: Vector2, b: Vector2, t: number): Vector2 {
  const ct = clamp01(t);
  return {
    x: a.x + (b.x - a.x) * ct,
    y: a.y + (b.y - a.y) * ct,
  };
}

export function lerpVec3(a: Vector3, b: Vector3, t: number): Vector3 {
  const ct = clamp01(t);
  return {
    x: a.x + (b.x - a.x) * ct,
    y: a.y + (b.y - a.y) * ct,
    z: a.z + (b.z - a.z) * ct,
  };
}

export function lerpVec4(a: Vector4, b: Vector4, t: number): Vector4 {
  const ct = clamp01(t);
  return {
    x: a.x + (b.x - a.x) * ct,
    y: a.y + (b.y - a.y) * ct,
    z: a.z + (b.z - a.z) * ct,
    w: a.w + (b.w - a.w) * ct,
  };
}

export function lerpObject<T extends Record<string, unknown>>(a: T, b: T, t: number): T {
  const result = { ...a } as Record<string, unknown>;
  for (const key of Object.keys(b)) {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') {
      result[key] = lerp(va, vb, t);
    } else if (isRecord(va) && isRecord(vb)) {
      result[key] = lerpObject(va, vb, t);
    } else {
      result[key] = vb;
    }
  }
  return result as T;
}

export function getValueAt<T>(from: T, to: T, progress: number): T {
  const t = clamp01(progress);
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, t) as T;
  }
  if (isVec4(from) && isVec4(to)) return lerpVec4(from, to, t) as T;
  if (isVec3(from) && isVec3(to)) return lerpVec3(from, to, t) as T;
  if (isVec2(from) && isVec2(to)) return lerpVec2(from, to, t) as T;
  if (isRecord(from) && isRecord(to))
    return lerpObject(from as Record<string, unknown>, to as Record<string, unknown>, t) as T;
  return t >= 1 ? to : from;
}

export function createInterpolator<T>(
  from: T,
  to: T,
  duration: number,
  startTime?: number,
): InterpolationState<T> {
  const start = startTime ?? GetGameTimer();
  return {
    from,
    to,
    duration,
    startTime: start,
    getValue(now: number): T {
      if (duration <= 0) return to;
      return getValueAt(from, to, (now - start) / duration);
    },
    getProgress(now: number): number {
      if (duration <= 0) return 1;
      return clamp01((now - start) / duration);
    },
    isComplete(now: number): boolean {
      return now - start >= duration;
    },
  };
}
