import type { Vector3 } from '@/shared/lib/math/types';
import type { PointOptions, ActivePoint } from './types';
import { createSpatialGrid } from '@/shared/lib/spatial/grid';
import { SpatialConfig } from '@/shared/config/spatial_config';
import { registerTick, unregisterTick } from './tick';

interface PointInternal<T = unknown> {
  id: number;
  coords: Vector3;
  radius: number;
  data: T;
  tags: Set<string>;
  onEnter?: (point: ActivePoint<T>) => void;
  onExit?: (point: ActivePoint<T>) => void;
  onNearby?: (point: ActivePoint<T>, distance: number) => void;
  inside: boolean;
  currentDistance: number;
  removed: boolean;
}

const points = new Map<number, PointInternal>();
const grid = createSpatialGrid<number>();
const insideSet = new Set<number>();
const nearbySet = new Set<number>();
let closestId: number | null = null;
let checkHandle: ReturnType<typeof setTimeout> | null = null;
let hasNearbyTick = false;

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

function buildActivePoint<T>(internal: PointInternal<T>): ActivePoint<T> {
  return {
    get id() {
      return internal.id;
    },
    get coords() {
      return internal.coords;
    },
    get radius() {
      return internal.radius;
    },
    get data() {
      return internal.data;
    },
    get tags() {
      return internal.tags;
    },
    get isInside() {
      return internal.inside;
    },
    get currentDistance() {
      return internal.currentDistance;
    },
    remove() {
      removePoint(internal.id);
    },
  };
}

function nearbyTick(): void {
  const playerCoords = toVec3(GetEntityCoords(PlayerPedId(), false));

  for (const id of nearbySet) {
    const point = points.get(id);
    if (!point || point.removed) continue;

    const dist = distance(playerCoords, point.coords);
    point.currentDistance = dist;

    if (point.onNearby) {
      point.onNearby(buildActivePoint(point), dist);
    }
  }
}

function coarseCheck(): void {
  const playerCoords = toVec3(GetEntityCoords(PlayerPedId(), false));
  const nearby = grid.getNearby(playerCoords, { radius: SpatialConfig.defaultNearbyRadius });

  const newInside = new Set<number>();
  const newNearby = new Set<number>();
  let newClosestId: number | null = null;
  let newClosestDist = Infinity;

  for (const entry of nearby) {
    const point = points.get(entry.data);
    if (!point || point.removed) continue;

    const dist = distance(playerCoords, point.coords);
    point.currentDistance = dist;

    if (dist <= point.radius) {
      newInside.add(point.id);
      newNearby.add(point.id);

      if (dist < newClosestDist) {
        newClosestDist = dist;
        newClosestId = point.id;
      }

      if (!insideSet.has(point.id)) {
        point.inside = true;
        if (point.onEnter) point.onEnter(buildActivePoint(point));
      }
    } else if (dist <= SpatialConfig.defaultNearbyRadius) {
      newNearby.add(point.id);
    }
  }

  for (const id of insideSet) {
    if (!newInside.has(id)) {
      const point = points.get(id);
      if (point && !point.removed) {
        point.inside = false;
        if (point.onExit) point.onExit(buildActivePoint(point));
      }
    }
  }

  insideSet.clear();
  for (const id of newInside) insideSet.add(id);

  nearbySet.clear();
  for (const id of newNearby) nearbySet.add(id);

  closestId = newClosestId;

  const hasOnNearby = [...nearbySet].some((id) => {
    const p = points.get(id);
    return p && !p.removed && p.onNearby;
  });

  if (hasOnNearby && !hasNearbyTick) {
    registerTick('points:nearby', nearbyTick);
    hasNearbyTick = true;
  } else if (!hasOnNearby && hasNearbyTick) {
    unregisterTick('points:nearby');
    hasNearbyTick = false;
  }
}

function startCheckLoop(): void {
  if (checkHandle !== null) return;

  coarseCheck();
  checkHandle = setInterval(coarseCheck, SpatialConfig.pointCheckInterval);
}

function stopCheckLoop(): void {
  if (checkHandle === null) return;
  clearInterval(checkHandle);
  checkHandle = null;

  if (hasNearbyTick) {
    unregisterTick('points:nearby');
    hasNearbyTick = false;
  }
}

export function addPoint<T = unknown>(options: PointOptions<T>): ActivePoint<T> {
  const internal: PointInternal<T> = {
    id: 0,
    coords: options.coords,
    radius: options.radius,
    data: (options.data ?? null) as T,
    tags: new Set(options.tags),
    onEnter: options.onEnter,
    onExit: options.onExit,
    onNearby: options.onNearby,
    inside: false,
    currentDistance: Infinity,
    removed: false,
  };

  const id = grid.add(options.coords, options.radius, 0, options.tags);
  internal.id = id;

  points.set(id, internal as PointInternal);

  if (points.size === 1) startCheckLoop();

  return buildActivePoint(internal);
}

export function removePoint(id: number): boolean {
  const point = points.get(id);
  if (!point) return false;

  point.removed = true;
  point.inside = false;
  insideSet.delete(id);
  nearbySet.delete(id);
  if (closestId === id) closestId = null;
  grid.remove(id);
  points.delete(id);

  if (points.size === 0) stopCheckLoop();

  return true;
}

export function getClosestPoint(): ActivePoint | null {
  if (closestId === null) return null;
  const point = points.get(closestId);
  if (!point || point.removed) return null;
  return buildActivePoint(point);
}

export function getPointsInside(): ActivePoint[] {
  const results: ActivePoint[] = [];
  for (const id of insideSet) {
    const point = points.get(id);
    if (point && !point.removed) results.push(buildActivePoint(point));
  }
  return results;
}

export function getPointsNearby(): ActivePoint[] {
  const results: ActivePoint[] = [];
  for (const id of nearbySet) {
    const point = points.get(id);
    if (point && !point.removed) results.push(buildActivePoint(point));
  }
  return results;
}
