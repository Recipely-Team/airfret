import type { Result } from '@core/result/result';

/** Wraps a success value. */
export function ok<T>(value: T): Result<T, never> {
  return { isOk: true, value };
}

/** Wraps a failure. */
export function fail<F>(failure: F): Result<never, F> {
  return { isOk: false, failure };
}
