import type { Vector2, Vector3, RGBA } from '@/shared/lib/math/types';

export interface GridEntry<T = unknown> {
  id: number;
  coords: Vector3;
  radius: number;
  tags: Set<string>;
  data: T;
  cells: number[];
  removed: boolean;
}

export interface GridOptions {
  cellSize?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface GridQueryOptions {
  radius?: number;
  tags?: string[];
  matchAllTags?: boolean;
  maxResults?: number;
  minZ?: number;
  maxZ?: number;
}

export interface GridQueryResult<T = unknown> {
  id: number;
  coords: Vector3;
  distance: number;
  data: T;
  tags: Set<string>;
}

export interface SpatialGrid<T = unknown> {
  add(coords: Vector3, radius: number, data: T, tags?: string[]): number;
  remove(id: number): boolean;
  update(id: number, coords: Vector3): void;
  getNearby(coords: Vector3, options?: GridQueryOptions): GridQueryResult<T>[];
  getClosest(coords: Vector3, options?: GridQueryOptions): GridQueryResult<T> | null;
  getCell(coords: Vector3): GridEntry<T>[];
  getCellKey(coords: Vector3): number;
  has(id: number): boolean;
  count(): number;
  clear(): void;
}

export interface SphereShape {
  type: 'sphere';
  coords: Vector3;
  radius: number;
}

export interface BoxShape {
  type: 'box';
  coords: Vector3;
  size: Vector3;
  heading: number;
  vertices: Vector3[];
  minZ: number;
  maxZ: number;
}

export interface PolyShape {
  type: 'poly';
  points: Vector2[];
  centroid: Vector2;
  minZ: number;
  maxZ: number;
  boundingRadius: number;
}

export type ZoneShape = SphereShape | BoxShape | PolyShape;

export interface ZoneOptions<T = unknown> {
  tags?: string[];
  data?: T;
  debug?: boolean;
  debugColor?: RGBA;
}

export interface ZoneCallbacks {
  onEnter?: (zone: ActiveZone) => void;
  onExit?: (zone: ActiveZone) => void;
  onInside?: (zone: ActiveZone) => void;
}

export interface ActiveZone<T = unknown> {
  readonly id: number;
  readonly shape: ZoneShape;
  readonly data: T;
  readonly tags: Set<string>;
  contains(coords: Vector3): boolean;
  remove(): void;
  setDebug(enabled: boolean, color?: RGBA): void;
}
