import type { Vector3 } from '@/shared/lib/math/types';

export interface NearbyObject {
  entity: number;
  coords: Vector3;
  distance: number;
}

export interface ObjectSearchOptions {
  maxDistance?: number;
  model?: number | string;
}
