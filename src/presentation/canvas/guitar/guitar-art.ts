import { computeLayout } from '@domain/fretboard/compute-layout';
import type { FretboardLayout } from '@domain/fretboard/fretboard-layout';
import type { ChainKind } from '@domain/instruments/chain-kind';
import { bodyGeometry } from '@presentation/canvas/guitar/body-geometry';
import { lookFor } from '@presentation/canvas/guitar/guitar-looks';
import { paintArtBody } from '@presentation/canvas/guitar/paint-art-body';
import { paintArtNeck } from '@presentation/canvas/guitar/paint-art-neck';

const MAX_DPR = 2;

/**
 * **GuitarArt** — the static guitar (everything but the strings), rendered once per screen size and
 * instrument into an offscreen canvas and blitted every frame.
 *
 * @remarks
 * - Always drawn right-handed and mirrored for lefty layouts, so wood grain and lighting stay natural.
 */
export class GuitarArt {
  private cache: { key: string; canvas: HTMLCanvasElement } | null = null;

  draw(ctx: CanvasRenderingContext2D, l: FretboardLayout, chain: ChainKind): void {
    const key = `${l.w}x${l.h}:${l.strings}:${chain}`;
    if (this.cache?.key !== key) this.cache = { key, canvas: this.render(l, chain) };
    ctx.save();
    if (l.isLefty) {
      ctx.translate(l.w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.cache.canvas, 0, 0, l.w, l.h);
    ctx.restore();
  }

  private render(l: FretboardLayout, chain: ChainKind): HTMLCanvasElement {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(l.w * dpr);
    canvas.height = Math.round(l.h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.scale(dpr, dpr);
    const righty = computeLayout(l.w, l.h, l.strings, false, l.maxFret);
    const look = lookFor(chain);
    const g = bodyGeometry(righty, look);
    paintArtBody(ctx, righty, g, look);
    paintArtNeck(ctx, righty, g, look);
    return canvas;
  }
}
