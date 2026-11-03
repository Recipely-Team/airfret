/**
 * **Result** — success or a typed failure, returned instead of throwing.
 *
 * @remarks
 * - Domain and application code never throw; they return a `Result`.
 * - Build values with `ok()` / `fail()` from `result-factories.ts`.
 */
export type Result<T, F> =
  | { readonly isOk: true; readonly value: T }
  | { readonly isOk: false; readonly failure: F };
