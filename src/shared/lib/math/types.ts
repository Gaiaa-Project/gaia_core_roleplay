export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface InterpolationState<T> {
  from: T;
  to: T;
  duration: number;
  startTime: number;
  getValue(now: number): T;
  getProgress(now: number): number;
  isComplete(now: number): boolean;
}

export interface WeightedOption<T> {
  value: T;
  weight: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type SeededRandom = () => number;
