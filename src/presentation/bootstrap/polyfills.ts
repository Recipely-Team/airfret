/** Corner radius as `roundRect` accepts it: one number or a list (the first is used here). */
type Radii = number | DOMPointInit | (number | DOMPointInit)[];

/**
 * What an older browser (a Chrome or Edge before 99, say, on a laptop that hasn't updated in years) lacks and the stage
 * needs: `roundRect` on the 2D canvas, traced with arcs — the instruments are drawn with it.
 */
export function installPolyfills(): void {
  if (typeof CanvasRenderingContext2D === 'undefined') return;
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & { roundRect?: unknown };
  if (typeof proto.roundRect === 'function') return;
  Object.defineProperty(proto, 'roundRect', {
    configurable: true,
    writable: true,
    value(this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radii: Radii = 0): void {
      const first = Array.isArray(radii) ? radii[0] : radii;
      const raw = typeof first === 'number' ? first : (first?.x ?? 0);
      const r = Math.max(0, Math.min(raw, Math.abs(w) / 2, Math.abs(h) / 2));
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    },
  });
}
