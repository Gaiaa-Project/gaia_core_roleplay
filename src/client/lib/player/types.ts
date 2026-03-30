import type { Vector3 } from '@/shared/lib/math/types';

export interface NearbyPlayer {
  playerId: number;
  ped: number;
  coords: Vector3;
  distance: number;
}

export interface PlayerSearchOptions {
  maxDistance?: number;
  includeSelf?: boolean;
}
