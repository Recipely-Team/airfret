import type { StrumDirection } from '@domain/gesture/strum-direction';

/** One string crossed by the strumming fingertip. */
export interface Crossing {
  readonly string: number;
  /** 0–1: where within the last frame interval the string was crossed. */
  readonly frac: number;
  /** Fingertip speed in screen-heights per second. */
  readonly speed: number;
  readonly dir: StrumDirection;
}
