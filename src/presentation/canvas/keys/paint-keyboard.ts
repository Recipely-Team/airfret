import type { PianoPlayer } from '@application/keys/piano-player';
import type { PianoKey } from '@domain/keys/piano-key';
import { FONT, Palette, rgba } from '@presentation/canvas/palette';
import { paintRowInstrument } from '@presentation/canvas/keys/paint-row-instrument';

/** Ivory, ebony and the case: natural materials, as the guitars are; rosewood and metal for struck bars. */
const COLOURS = { ivory: '#f2ece0', ivoryShade: '#d9d1c2', ebony: '#17140f', ebonyTop: '#3a342b', case: '#1d120c', felt: '#6b1f1f' } as const;
/** Bars: top and edge of a natural, then of a sharp. */
const BARS = {
  rosewood: { light: '#a8573a', dark: '#6b2f1c', sharpLight: '#8e4630', sharpDark: '#5a2616' },
  metal: { light: '#e4e6e9', dark: '#9aa0a6', sharpLight: '#cfd2d6', sharpDark: '#868c93' },
} as const;
const CASE_PAD = 10;
const RADIUS = 4;
/** A pressed key sinks this far (share of the key length) and darkens. */
const PRESS_DEPTH = 0.012;
const C = 0;
const OCTAVE = 12;

/**
 * The keyboard: the case and its red felt strip, ivory and ebony keys (swapped on a harpsichord), pressed
 * keys sunk and lit in the accent colour as they sound, every C labelled with its octave (C4 = middle C).
 */
export function paintKeyboard(ctx: CanvasRenderingContext2D, piano: PianoPlayer): void {
  const l = piano.layout;
  if (!l) return;
  // A kanun, a ney, a clarinet…: drawn as itself, not as keys.
  if (piano.keyboard?.body) {
    paintRowInstrument(ctx, piano);
    return;
  }
  const keys = l.keys;
  const x0 = Math.min(...keys.map((k) => k.x0));
  const x1 = Math.max(...keys.map((k) => k.x1));
  const keyLength = l.bottom - l.top;
  ctx.fillStyle = COLOURS.case;
  roundRect(ctx, x0 - CASE_PAD, l.top - CASE_PAD * 3, x1 - x0 + CASE_PAD * 2, keyLength + CASE_PAD * 4, RADIUS * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.felt;
  ctx.fillRect(x0, l.top - CASE_PAD * 0.8, x1 - x0, CASE_PAD * 0.6);
  const down = new Set([...piano.pressed, ...piano.shown]);
  const look = piano.keyboard?.look ?? 'ivory';
  const isReversed = look === 'reversed';
  for (const k of keys.filter((x) => !x.isBlack)) paintKey(ctx, k, down.has(k.midi), piano.glow.get(k.midi) ?? 0, keyLength, look);
  for (const k of keys.filter((x) => x.isBlack)) paintKey(ctx, k, down.has(k.midi), piano.glow.get(k.midi) ?? 0, keyLength, look);
  ctx.font = `500 ${Math.max(9, Math.min(13, (x1 - x0) / keys.length))}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isReversed ? 'rgba(236, 228, 210, 0.6)' : 'rgba(40, 32, 24, 0.55)';
  for (const k of keys) {
    if (k.isBlack || k.midi % OCTAVE !== C) continue;
    ctx.fillText(`C${Math.floor(k.midi / OCTAVE) - 1}`, (k.x0 + k.x1) / 2, k.y1 - 12);
  }
}

function paintKey(ctx: CanvasRenderingContext2D, k: PianoKey, isDown: boolean, glow: number, keyLength: number, look: 'ivory' | 'reversed' | 'rosewood' | 'metal'): void {
  // A harpsichord's naturals are dark and its sharps light: the key's colour, not its shape, swaps.
  const isDark = k.isBlack !== (look === 'reversed');
  const sink = isDown ? keyLength * PRESS_DEPTH : 0;
  const w = k.x1 - k.x0;
  const gap = k.isBlack ? 0 : 1;
  const y0 = k.y0 + sink;
  const h = k.y1 - k.y0;
  const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
  if (look === 'rosewood' || look === 'metal') {
    // A struck bar: its own wood or metal, the sharps a shade darker.
    const bar = BARS[look];
    grad.addColorStop(0, k.isBlack ? bar.sharpLight : bar.light);
    grad.addColorStop(1, k.isBlack ? bar.sharpDark : bar.dark);
  } else if (isDark) {
    grad.addColorStop(0, COLOURS.ebonyTop);
    grad.addColorStop(0.85, COLOURS.ebony);
    grad.addColorStop(1, '#000');
  } else {
    grad.addColorStop(0, COLOURS.ivoryShade);
    grad.addColorStop(0.08, COLOURS.ivory);
    grad.addColorStop(1, isDown ? COLOURS.ivoryShade : COLOURS.ivory);
  }
  ctx.fillStyle = grad;
  roundRect(ctx, k.x0 + gap / 2, y0, w - gap, h, k.isBlack ? RADIUS * 0.6 : RADIUS);
  ctx.fill();
  if (!k.isBlack) {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // The key that sounds: accent light from the front edge, as strong as it was struck, fading with the note.
  const light = Math.max(isDown ? 0.35 : 0, glow * 0.6);
  if (light > 0.01) {
    ctx.fillStyle = rgba(Palette.accent, light);
    roundRect(ctx, k.x0 + gap / 2, y0 + h * 0.45, w - gap, h * 0.55, RADIUS);
    ctx.fill();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
