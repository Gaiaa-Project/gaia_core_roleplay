import type { Vector3 } from '@/shared/lib/math/types';
import type { NearbyPlayer, PlayerSearchOptions } from './types';

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function toVec3(arr: number[]): Vector3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

export function getClosestPlayer(
  coords: Vector3,
  options?: PlayerSearchOptions,
): NearbyPlayer | null {
  const players = getPlayers() as string[];
  const maxDist = options?.maxDistance ?? 2.0;
  const ignorePlayer = options?.ignorePlayer;

  let best: NearbyPlayer | null = null;

  for (let i = 0; i < players.length; i++) {
    const playerId = parseInt(players[i]!);

    if (ignorePlayer !== undefined && playerId === ignorePlayer) continue;

    const ped = GetPlayerPed(String(playerId));
    const playerCoords = toVec3(GetEntityCoords(ped));
    const dist = distance(coords, playerCoords);

    if (dist < maxDist && (!best || dist < best.distance)) {
      best = { playerId, ped, coords: playerCoords, distance: dist };
    }
  }

  return best;
}

export function getNearbyPlayers(coords: Vector3, options?: PlayerSearchOptions): NearbyPlayer[] {
  const players = getPlayers() as string[];
  const maxDist = options?.maxDistance ?? 2.0;
  const ignorePlayer = options?.ignorePlayer;

  const results: NearbyPlayer[] = [];

  for (let i = 0; i < players.length; i++) {
    const playerId = parseInt(players[i]!);

    if (ignorePlayer !== undefined && playerId === ignorePlayer) continue;

    const ped = GetPlayerPed(String(playerId));
    const playerCoords = toVec3(GetEntityCoords(ped));
    const dist = distance(coords, playerCoords);

    if (dist < maxDist) {
      results.push({ playerId, ped, coords: playerCoords, distance: dist });
    }
  }

  results.sort((a, b) => a.distance - b.distance);

  return results;
}
