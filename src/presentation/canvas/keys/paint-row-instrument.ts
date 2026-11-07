import type { PianoPlayer } from '@application/keys/piano-player';
import { midiToName } from '@domain/music/pitch';
import { paintKanun, paintKanunStrings, paintKemence, paintNey, paintWindBody } from '@presentation/canvas/keys/paint-instrument-bodies';
import { FONT, Palette, rgba } from '@presentation/canvas/palette';

/** A note's place glows this strongly behind the instrument while it sounds. */
const LIT_BAND = 0.16;
/** Narrower than this a place shows no name of its own — only its C. */
const NAMED_MIN_WIDTH = 26;
const OCTAVE = 12;
const ACCENT = `rgb(${Palette.accent})`;

/**
 * An instrument that isn't a keyboard (a kanun, a ney, a kemençe, a clarinet, a trumpet), drawn as itself with its
 * notes in one row along it: faint dividers mark each note's place, names run beneath, and a sounding note glows
 * where it is — its string course on the kanun, a light on the reed, the tube or the strings.
 */
export function paintRowInstrument(ctx: CanvasRenderingContext2D, piano: PianoPlayer): void {
  const l = piano.layout;
  const body = piano.keyboard?.body;
  if (!l || !body || !l.keys.length) return;
  const first = l.keys[0];
  const last = l.keys[l.keys.length - 1];
  if (!first || !last) return;
  const box = { x0: first.x0, x1: last.x1, top: l.top, bottom: l.bottom };
  const colW = first.x1 - first.x0;
  const down = new Set([...piano.pressed, ...piano.shown]);
  const lit = (midi: number) => Math.max(down.has(midi) ? 1 : 0, piano.glow.get(midi) ?? 0);
  // The places of the notes: a soft band behind each sounding one, hairlines between them.
  for (const k of l.keys) {
    const g = lit(k.midi);
    if (g > 0.02) {
      ctx.fillStyle = rgba(Palette.accent, LIT_BAND * g);
      ctx.fillRect(k.x0, box.top - (box.bottom - box.top) * 0.08, k.x1 - k.x0, (box.bottom - box.top) * 1.16);
    }
  }
  ctx.strokeStyle = 'rgba(236, 232, 225, 0.08)';
  ctx.lineWidth = 1;
  for (const k of l.keys.slice(1)) {
    ctx.beginPath();
    ctx.moveTo(k.x0, box.top - 10);
    ctx.lineTo(k.x0, box.bottom + 10);
    ctx.stroke();
  }
  let markerYs: number[] = [];
  if (body === 'kanun') {
    paintKanun(ctx, box);
    for (const k of l.keys) paintKanunStrings(ctx, (k.x0 + k.x1) / 2, box, colW, lit(k.midi) > 0.3, ACCENT);
  } else if (body === 'ney') markerYs = [paintNey(ctx, box)];
  else if (body === 'kemence') markerYs = paintKemence(ctx, box);
  else markerYs = [paintWindBody(ctx, box, body)];
  // A light where the sounding note is, on the reed, the tube or the strings.
  for (const k of l.keys) {
    const g = lit(k.midi);
    if (g < 0.05 || !markerYs.length) continue;
    const x = (k.x0 + k.x1) / 2;
    for (const y of markerYs) {
      ctx.beginPath();
      ctx.arc(x, y, Math.min(colW * 0.32, 9), 0, Math.PI * 2);
      ctx.fillStyle = rgba(Palette.accent, 0.35 + 0.6 * g);
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 14 * g;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  // Names beneath: every note where there is room, else every C.
  ctx.font = `500 ${Math.max(9, Math.min(12, colW * 0.42))}px ${FONT}`;
  ctx.textAlign = 'center';
  const y = box.bottom + (body === 'kanun' ? 34 : 22);
  for (const k of l.keys) {
    const isC = k.midi % OCTAVE === 0;
    if (colW < NAMED_MIN_WIDTH && !isC) continue;
    ctx.fillStyle = lit(k.midi) > 0.3 ? ACCENT : isC ? 'rgba(236, 232, 225, 0.7)' : 'rgba(236, 232, 225, 0.38)';
    ctx.fillText(midiToName(k.midi), (k.x0 + k.x1) / 2, y);
  }
}
