/** Proportions of a guitar body outline: body length along x, width across. */
interface Bout {
  readonly t: number;
  readonly radius: number;
  readonly halfWidth: number;
}

const SMOOTH_UNION = 4;
const STEPS = 90;

/**
 * Traces a guitar body outline from the neck joint (x0) along +x.
 *
 * @remarks
 * - Each bout is half an ellipse in profile: hw(t) = H·√(1 − ((t − c)/r)²).
 * - Upper and lower bouts merge with a smooth union, (a⁴ + b⁴)^(1/4), which forms a soft waist.
 */
export function traceBody(ctx: CanvasRenderingContext2D, x0: number, cy: number, length: number, width: number, upper: Bout, lower: Bout): void {
  const half = (t: number) => {
    const e = (b: Bout) => {
      const u = (t - b.t) / b.radius;
      return Math.abs(u) >= 1 ? 0 : b.halfWidth * Math.sqrt(1 - u * u);
    };
    const a = e(upper);
    const b = e(lower);
    return Math.pow(Math.pow(a, SMOOTH_UNION) + Math.pow(b, SMOOTH_UNION), 1 / SMOOTH_UNION) * width;
  };
  ctx.beginPath();
  for (let k = 0; k <= STEPS; k++) {
    const t = k / STEPS;
    const x = x0 + t * length;
    if (k === 0) ctx.moveTo(x, cy - half(t));
    else ctx.lineTo(x, cy - half(t));
  }
  for (let k = STEPS; k >= 0; k--) {
    const t = k / STEPS;
    ctx.lineTo(x0 + t * length, cy + half(t));
  }
  ctx.closePath();
}

export const ACOUSTIC_BOUTS = {
  upper: { t: 0.27, radius: 0.29, halfWidth: 0.4 },
  lower: { t: 0.66, radius: 0.345, halfWidth: 0.49 },
} as const;

export const CLASSICAL_BOUTS = {
  upper: { t: 0.26, radius: 0.28, halfWidth: 0.39 },
  lower: { t: 0.66, radius: 0.345, halfWidth: 0.47 },
} as const;

export const SOLID_BOUTS = {
  upper: { t: 0.3, radius: 0.32, halfWidth: 0.42 },
  lower: { t: 0.66, radius: 0.34, halfWidth: 0.5 },
} as const;

/** A saz's bowl seen from the front: a pear — narrow where the neck joins, wide and round at the bottom. */
export const SAZ_BOUTS = {
  upper: { t: 0.22, radius: 0.3, halfWidth: 0.2 },
  lower: { t: 0.64, radius: 0.37, halfWidth: 0.5 },
} as const;

/**
 * A balalaika's body: a triangle, narrow where the neck joins and widening straight to a flat base past the
 * bridge, its corners a little rounded.
 */
export function traceTriangle(ctx: CanvasRenderingContext2D, x0: number, cy: number, length: number, width: number): void {
  const tip = width * 0.07;
  const corner = width * 0.06;
  ctx.beginPath();
  ctx.moveTo(x0, cy - tip);
  ctx.lineTo(x0 + length - corner, cy - width / 2 + corner * 0.4);
  ctx.quadraticCurveTo(x0 + length, cy - width / 2, x0 + length, cy - width / 2 + corner);
  ctx.lineTo(x0 + length, cy + width / 2 - corner);
  ctx.quadraticCurveTo(x0 + length, cy + width / 2, x0 + length - corner, cy + width / 2 - corner * 0.4);
  ctx.lineTo(x0, cy + tip);
  ctx.closePath();
}
