import type { RGBA, Vector3 } from '@/shared/lib/math/types';
import type { ZoneShape, BoxShape, PolyShape } from '@/shared/lib/spatial/types';
import { registerTick, unregisterTick } from './tick';

interface DebugZone {
  shape: ZoneShape;
  color: RGBA;
}

const debugZones = new Map<number, DebugZone>();
let active = false;

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

function distanceSq(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function getShapeCenter(shape: ZoneShape): Vector3 {
  switch (shape.type) {
    case 'sphere':
    case 'box':
      return shape.coords;
    case 'poly':
      return { x: shape.centroid.x, y: shape.centroid.y, z: (shape.minZ + shape.maxZ) / 2 };
  }
}

function drawDebugSphere(shape: { coords: Vector3; radius: number }, c: RGBA): void {
  DrawMarker(
    28,
    shape.coords.x,
    shape.coords.y,
    shape.coords.z,
    0,
    0,
    0,
    0,
    0,
    0,
    shape.radius * 2,
    shape.radius * 2,
    shape.radius * 2,
    c.r,
    c.g,
    c.b,
    Math.floor(c.a * 255),
    false,
    false,
    2,
    false,
    // @ts-expect-error FiveM overload
    false,
    false,
    false,
  );
}

function drawDebugWall(a: Vector3, b: Vector3, minZ: number, maxZ: number, c: RGBA): void {
  const alpha = Math.floor(c.a * 255);
  const a1 = { x: a.x, y: a.y, z: minZ };
  const a2 = { x: a.x, y: a.y, z: maxZ };
  const b1 = { x: b.x, y: b.y, z: minZ };
  const b2 = { x: b.x, y: b.y, z: maxZ };

  DrawPoly(a1.x, a1.y, a1.z, b1.x, b1.y, b1.z, a2.x, a2.y, a2.z, c.r, c.g, c.b, alpha);
  DrawPoly(a2.x, a2.y, a2.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z, c.r, c.g, c.b, alpha);
  DrawPoly(b1.x, b1.y, b1.z, a2.x, a2.y, a2.z, b2.x, b2.y, b2.z, c.r, c.g, c.b, alpha);
  DrawPoly(b2.x, b2.y, b2.z, a2.x, a2.y, a2.z, b1.x, b1.y, b1.z, c.r, c.g, c.b, alpha);

  DrawLine(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z, c.r, c.g, c.b, 255);
  DrawLine(a1.x, a1.y, a1.z, b1.x, b1.y, b1.z, c.r, c.g, c.b, 255);
  DrawLine(a2.x, a2.y, a2.z, b2.x, b2.y, b2.z, c.r, c.g, c.b, 255);
}

function drawDebugBox(shape: BoxShape, c: RGBA): void {
  const v = shape.vertices;
  for (let i = 0; i < v.length; i++) {
    drawDebugWall(v[i]!, v[(i + 1) % v.length]!, shape.minZ, shape.maxZ, c);
  }
}

function drawDebugPoly(shape: PolyShape, c: RGBA): void {
  const pts = shape.points;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    drawDebugWall({ x: a.x, y: a.y, z: 0 }, { x: b.x, y: b.y, z: 0 }, shape.minZ, shape.maxZ, c);
  }
}

function debugTick(): void {
  const playerCoords = toVec3(GetEntityCoords(PlayerPedId(), false));
  const maxDistSq = 200 * 200;

  for (const [, zone] of debugZones) {
    const center = getShapeCenter(zone.shape);
    if (distanceSq(playerCoords, center) > maxDistSq) continue;

    switch (zone.shape.type) {
      case 'sphere':
        drawDebugSphere(zone.shape, zone.color);
        break;
      case 'box':
        drawDebugBox(zone.shape, zone.color);
        break;
      case 'poly':
        drawDebugPoly(zone.shape, zone.color);
        break;
    }
  }
}

function updateTick(): void {
  if (debugZones.size > 0 && !active) {
    registerTick('zones:debug', debugTick);
    active = true;
  } else if (debugZones.size === 0 && active) {
    unregisterTick('zones:debug');
    active = false;
  }
}

export function enableDebug(id: number, shape: ZoneShape, color: RGBA): void {
  debugZones.set(id, { shape, color });
  updateTick();
}

export function disableDebug(id: number): void {
  debugZones.delete(id);
  updateTick();
}

export function isDebugActive(id: number): boolean {
  return debugZones.has(id);
}
