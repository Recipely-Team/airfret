import type { FailureCode } from '@core/failure/failure-code';

/**
 * **Failure** — the error half of a `Result`.
 *
 * @remarks
 * - `code` is what callers branch on; `detail` is diagnostic text for logs only.
 */
export class Failure {
  constructor(
    readonly code: FailureCode,
    readonly detail: string,
  ) {}
}
