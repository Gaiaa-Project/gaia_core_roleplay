import type { Vector3 } from '@/shared/lib/math/types';

export interface NearbyPed {
  entity: number;
  coords: Vector3;
  distance: number;
}

export interface PedSearchOptions {
  maxDistance?: number;
  model?: number | string;
  includePlayers?: boolean;
}
