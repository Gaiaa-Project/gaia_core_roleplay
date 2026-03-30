import type { Vector3 } from '@/shared/lib/math/types';
import type { NearbyVehicle, VehicleSearchOptions } from './types';

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

function getCurrentVehicle(): number | null {
  if (typeof PlayerPedId === 'undefined') return null;
  const ped = PlayerPedId();
  const vehicle = GetVehiclePedIsIn(ped, false);
  return vehicle !== 0 ? vehicle : null;
}

export function getClosestVehicle(
  coords: Vector3,
  options?: VehicleSearchOptions,
): NearbyVehicle | null {
  const pool = GetGamePool('CVehicle') as number[];
  const maxDist = options?.maxDistance ?? 2.0;
  const filterHash = options?.model !== undefined ? resolveModel(options.model) : null;
  const includeCurrentVehicle = options?.includeCurrentVehicle ?? false;
  const currentVehicle = includeCurrentVehicle ? null : getCurrentVehicle();

  let best: NearbyVehicle | null = null;

  for (let i = 0; i < pool.length; i++) {
    const entity = pool[i]!;

    if (currentVehicle !== null && entity === currentVehicle) continue;
    if (filterHash !== null && GetEntityModel(entity) !== filterHash) continue;

    const entityCoords = toVec3(GetEntityCoords(entity));
    const dist = distance(coords, entityCoords);

    if (dist < maxDist && (!best || dist < best.distance)) {
      best = { entity, coords: entityCoords, distance: dist };
    }
  }

  return best;
}

export function getNearbyVehicles(
  coords: Vector3,
  options?: VehicleSearchOptions,
): NearbyVehicle[] {
  const pool = GetGamePool('CVehicle') as number[];
  const maxDist = options?.maxDistance ?? 2.0;
  const filterHash = options?.model !== undefined ? resolveModel(options.model) : null;
  const includeCurrentVehicle = options?.includeCurrentVehicle ?? false;
  const currentVehicle = includeCurrentVehicle ? null : getCurrentVehicle();

  const results: NearbyVehicle[] = [];

  for (let i = 0; i < pool.length; i++) {
    const entity = pool[i]!;

    if (currentVehicle !== null && entity === currentVehicle) continue;
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
