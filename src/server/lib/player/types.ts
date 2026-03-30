import type { Vector3 } from '@/shared/lib/math/types';

export interface PlayerIdentifiers {
  license: string | null;
  license2: string | null;
  steam: string | null;
  discord: string | null;
  fivem: string | null;
  xbl: string | null;
  live: string | null;
  ip: string | null;
  name: string;
}

export interface NearbyPlayer {
  playerId: number;
  ped: number;
  coords: Vector3;
  distance: number;
}

export interface PlayerSearchOptions {
  maxDistance?: number;
  ignorePlayer?: number;
}
