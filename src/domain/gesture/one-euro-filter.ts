const MIN_DT = 1e-3;
const DERIVATIVE_GAIN = 100;

/**
 * **OneEuroFilter** — adaptive low-pass (Casiez et al. 2012).
 *
 * @remarks
 * - Smooths heavily while still and barely at all while moving fast — what a strumming hand needs.
 */
export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  constructor(
    private readonly minCutoff: number,
    private readonly beta: number,
    private readonly dCutoff = 1,
  ) {}

  reset(): void {
    this.x = null;
  }

  filter(value: number, t: number): number {
    if (this.x === null) {
      this.x = value;
      this.t = t;
      this.dx = 0;
      return value;
    }
    const dt = Math.max(MIN_DT, t - this.t);
    this.t = t;
    const ad = alpha(dt, this.dCutoff);
    this.dx = ad * ((value - this.x) / dt) + (1 - ad) * this.dx;
    const a = alpha(dt, this.minCutoff + this.beta * Math.abs(this.dx) * DERIVATIVE_GAIN);
    this.x = a * value + (1 - a) * this.x;
    return this.x;
  }
}

function alpha(dt: number, cutoff: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}
