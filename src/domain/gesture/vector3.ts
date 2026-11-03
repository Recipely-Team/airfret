import type { Point } from '@domain/fretboard/point';

/** Minimal 3-D vector maths for hand geometry. Missing depth counts as 0. */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function sub3(a: Point, b: Point): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

export function cross3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

export function dot3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function scale3(a: Vector3, k: number): Vector3 {
  return { x: a.x * k, y: a.y * k, z: a.z * k };
}

export function length3(a: Vector3): number {
  return Math.hypot(a.x, a.y, a.z);
}

/** Unit vector, or the zero vector for a degenerate input. */
export function normalize3(a: Vector3): Vector3 {
  const n = length3(a);
  return n > 1e-9 ? scale3(a, 1 / n) : { x: 0, y: 0, z: 0 };
}
