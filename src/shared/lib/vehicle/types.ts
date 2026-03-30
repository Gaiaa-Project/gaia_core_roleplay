import type { Vector3 } from '@/shared/lib/math/types';

export interface NearbyVehicle {
  entity: number;
  coords: Vector3;
  distance: number;
}

export interface VehicleSearchOptions {
  maxDistance?: number;
  model?: number | string;
  includeCurrentVehicle?: boolean;
}
