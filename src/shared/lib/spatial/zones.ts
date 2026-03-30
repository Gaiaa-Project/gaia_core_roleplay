import type { Vector2, Vector3, RGBA } from '@/shared/lib/math/types';
import type { ActiveZone, ZoneOptions, ZoneShape } from './types';
import { containsZone, createSphereShape, createBoxShape, createPolyShape } from './geometry';
import { createSpatialGrid } from './grid';

interface ZoneInternal<T = unknown> {
  id: number;
  shape: ZoneShape;
  data: T;
  tags: Set<string>;
  debug: boolean;
  debugColor: RGBA;
  removed: boolean;
}

let nextId = 1;
const zones = new Map<number, ZoneInternal>();
const zoneGrid = createSpatialGrid<number>();

function getShapeCoords(shape: ZoneShape): Vector3 {
  switch (shape.type) {
    case 'sphere':
      return shape.coords;
    case 'box':
      return shape.coords;
    case 'poly':
      return { x: shape.centroid.x, y: shape.centroid.y, z: (shape.minZ + shape.maxZ) / 2 };
  }
}

function getShapeRadius(shape: ZoneShape): number {
  switch (shape.type) {
    case 'sphere':
      return shape.radius;
    case 'box':
      return Math.sqrt((shape.size.x / 2) ** 2 + (shape.size.y / 2) ** 2);
    case 'poly':
      return shape.boundingRadius;
  }
}

function buildActiveZone<T>(internal: ZoneInternal<T>): ActiveZone<T> {
  return {
    get id() {
      return internal.id;
    },
    get shape() {
      return internal.shape;
    },
    get data() {
      return internal.data;
    },
    get tags() {
      return internal.tags;
    },
    contains(coords: Vector3) {
      return containsZone(internal.shape, coords);
    },
    remove() {
      if (internal.removed) return;
      internal.removed = true;
      zoneGrid.remove(internal.id);
      zones.delete(internal.id);
    },
    setDebug(enabled: boolean, color?: RGBA) {
      internal.debug = enabled;
      if (color) internal.debugColor = color;
    },
  };
}

function registerZone<T>(shape: ZoneShape, options?: ZoneOptions<T>): ActiveZone<T> {
  const id = nextId++;
  const internal: ZoneInternal<T> = {
    id,
    shape,
    data: (options?.data ?? null) as T,
    tags: new Set(options?.tags),
    debug: options?.debug ?? false,
    debugColor: options?.debugColor ?? { r: 0, g: 150, b: 255, a: 80 },
    removed: false,
  };

  zones.set(id, internal);
  const coords = getShapeCoords(shape);
  const radius = getShapeRadius(shape);
  zoneGrid.add(coords, radius, id, options?.tags);

  return buildActiveZone(internal);
}

export function addSphereZone<T = unknown>(
  coords: Vector3,
  radius: number,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return registerZone(createSphereShape(coords, radius), options);
}

export function addBoxZone<T = unknown>(
  coords: Vector3,
  size: Vector3,
  heading: number,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return registerZone(createBoxShape(coords, size, heading), options);
}

export function addPolyZone<T = unknown>(
  points: Vector2[],
  minZ: number,
  maxZ: number,
  options?: ZoneOptions<T>,
): ActiveZone<T> {
  return registerZone(createPolyShape(points, minZ, maxZ), options);
}

export function removeZone(id: number): boolean {
  const internal = zones.get(id);
  if (!internal) return false;
  internal.removed = true;
  zoneGrid.remove(id);
  zones.delete(id);
  return true;
}

export function getZoneById<T = unknown>(id: number): ActiveZone<T> | null {
  const internal = zones.get(id) as ZoneInternal<T> | undefined;
  if (!internal || internal.removed) return null;
  return buildActiveZone(internal);
}

export function getZonesAtCoords(coords: Vector3, tags?: string[]): ActiveZone[] {
  const nearby = zoneGrid.getNearby(coords, { radius: 500, tags });
  const results: ActiveZone[] = [];

  for (const entry of nearby) {
    const internal = zones.get(entry.data);
    if (!internal || internal.removed) continue;
    if (containsZone(internal.shape, coords)) {
      results.push(buildActiveZone(internal));
    }
  }

  return results;
}

export function getAllZones(): ActiveZone[] {
  const results: ActiveZone[] = [];
  for (const internal of zones.values()) {
    if (!internal.removed) results.push(buildActiveZone(internal));
  }
  return results;
}

export function getZoneGrid() {
  return zoneGrid;
}

export function getZoneInternal(id: number) {
  return zones.get(id);
}
