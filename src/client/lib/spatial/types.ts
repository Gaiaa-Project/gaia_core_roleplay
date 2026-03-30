import type { Vector3 } from '@/shared/lib/math/types';
import type { ActiveZone } from '@/shared/lib/spatial/types';

export interface PointOptions<T = unknown> {
  coords: Vector3;
  radius: number;
  data?: T;
  tags?: string[];
  onEnter?: (point: ActivePoint<T>) => void;
  onExit?: (point: ActivePoint<T>) => void;
  onNearby?: (point: ActivePoint<T>, distance: number) => void;
}

export interface ActivePoint<T = unknown> {
  readonly id: number;
  readonly coords: Vector3;
  readonly radius: number;
  readonly data: T;
  readonly tags: Set<string>;
  readonly isInside: boolean;
  readonly currentDistance: number;
  remove(): void;
}

export interface ZoneProximityCallbacks {
  onEnter?: (zone: ActiveZone) => void;
  onExit?: (zone: ActiveZone) => void;
  onInside?: (zone: ActiveZone) => void;
}

export interface ZoneRegistration {
  zoneId: number;
  callbacks: ZoneProximityCallbacks;
}
