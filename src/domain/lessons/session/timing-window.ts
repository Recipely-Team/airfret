/** Judging windows, seconds either side of the target. */
export const TimingWindow = {
  perfect: 0.085,
  good: 0.17,
  /** Wait mode accepts an arrival this many good-windows early. */
  waitEarlyFactor: 1.5,
} as const;
