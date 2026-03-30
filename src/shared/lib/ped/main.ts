import type { Vector3 } from '@/shared/lib/math/types';
import type { NearbyPed, PedSearchOptions } from './types';

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

function resolveModel(model: number | string): number {
  return typeof model === 'string' ? GetHashKey(model) : model;
}

export function getClosestPed(coords: Vector3, options?: PedSearchOptions): NearbyPed | null {
  const pool = GetGamePool('CPed') as number[];
  const maxDist = options?.maxDistance ?? 2.0;
  const filterHash = options?.model !== undefined ? resolveModel(options.model) : null;
  const includePlayers = options?.includePlayers ?? false;

  let best: NearbyPed | null = null;

  for (let i = 0; i < pool.length; i++) {
    const entity = pool[i]!;

    if (!includePlayers && IsPedAPlayer(entity)) continue;
    if (filterHash !== null && GetEntityModel(entity) !== filterHash) continue;

    const entityCoords = toVec3(GetEntityCoords(entity));
    const dist = distance(coords, entityCoords);

    if (dist < maxDist && (!best || dist < best.distance)) {
      best = { entity, coords: entityCoords, distance: dist };
    }
  }

  return best;
}

export function getNearbyPeds(coords: Vector3, options?: PedSearchOptions): NearbyPed[] {
  const pool = GetGamePool('CPed') as number[];
  const maxDist = options?.maxDistance ?? 2.0;
  const filterHash = options?.model !== undefined ? resolveModel(options.model) : null;
  const includePlayers = options?.includePlayers ?? false;

  const results: NearbyPed[] = [];

  for (let i = 0; i < pool.length; i++) {
    const entity = pool[i]!;

    if (!includePlayers && IsPedAPlayer(entity)) continue;
    if (filterHash !== null && GetEntityModel(entity) !== filterHash) continue;

    const entityCoords = toVec3(GetEntityCoords(entity));
    const dist = distance(coords, entityCoords);

    if (dist < maxDist) {
      results.push({ entity, coords: entityCoords, distance: dist });
    }
  }

  results.sort((a, b) => a.distance - b.distance);

  return results;
}
