import type { Vector2, Vector3 } from '@/shared/lib/math/types';
import type { SphereShape, BoxShape, PolyShape, ZoneShape } from './types';
import { getRelativeCoords } from '@/shared/lib/math/coords';

export function containsSphere(shape: SphereShape, coords: Vector3): boolean {
  const dx = coords.x - shape.coords.x;
  const dy = coords.y - shape.coords.y;
  const dz = coords.z - shape.coords.z;
  return dx * dx + dy * dy + dz * dz <= shape.radius * shape.radius;
}

export function containsBox(shape: BoxShape, coords: Vector3): boolean {
  if (coords.z < shape.minZ || coords.z > shape.maxZ) return false;
  return pointInPolygon2D(shape.vertices, coords);
}

export function containsPoly(shape: PolyShape, coords: Vector3): boolean {
  if (coords.z < shape.minZ || coords.z > shape.maxZ) return false;
  return pointInPolygon2D(shape.points, coords);
}

export function containsZone(shape: ZoneShape, coords: Vector3): boolean {
  switch (shape.type) {
    case 'sphere':
      return containsSphere(shape, coords);
    case 'box':
      return containsBox(shape, coords);
    case 'poly':
      return containsPoly(shape, coords);
  }
}

function pointInPolygon2D(
  vertices: (Vector2 | Vector3)[],
  point: { x: number; y: number },
): boolean {
  let crossings = 0;
  const len = vertices.length;

  for (let i = 0; i < len; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % len]!;

    if ((a.y <= point.y && b.y > point.y) || (b.y <= point.y && a.y > point.y)) {
      const t = (point.y - a.y) / (b.y - a.y);
      if (point.x < a.x + t * (b.x - a.x)) {
        crossings++;
      }
    }
  }

  return crossings % 2 === 1;
}

export function createSphereShape(coords: Vector3, radius: number): SphereShape {
  return { type: 'sphere', coords, radius };
}

export function createBoxShape(coords: Vector3, size: Vector3, heading: number): BoxShape {
  const halfW = size.x / 2;
  const halfL = size.y / 2;
  const halfH = size.z / 2;

  const offsets: Vector3[] = [
    { x: -halfW, y: -halfL, z: 0 },
    { x: halfW, y: -halfL, z: 0 },
    { x: halfW, y: halfL, z: 0 },
    { x: -halfW, y: halfL, z: 0 },
  ];

  const vertices = offsets.map((offset) => getRelativeCoords(coords, heading, offset));

  return {
    type: 'box',
    coords,
    size,
    heading,
    vertices,
    minZ: coords.z - halfH,
    maxZ: coords.z + halfH,
  };
}

export function createPolyShape(points: Vector2[], minZ: number, maxZ: number): PolyShape {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  const centroid: Vector2 = { x: cx / points.length, y: cy / points.length };

  let maxDistSq = 0;
  for (const p of points) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dSq = dx * dx + dy * dy;
    if (dSq > maxDistSq) maxDistSq = dSq;
  }

  return {
    type: 'poly',
    points,
    centroid,
    minZ,
    maxZ,
    boundingRadius: Math.sqrt(maxDistSq),
  };
}
