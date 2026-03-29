import type { Vector3 } from '@/shared/lib/math/types';

export interface RaycastResult {
  hit: boolean;
  entityHit: number;
  endCoords: Vector3;
  surfaceNormal: Vector3;
  materialHash: number;
}

export interface RaycastOptions {
  flags?: number;
  ignoreEntity?: number;
  ignoreFlags?: number;
}
