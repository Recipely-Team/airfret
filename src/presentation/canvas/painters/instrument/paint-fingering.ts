import { stringY } from '@domain/fretboard/neck-geometry';
import { PlayMode } from '@domain/instruments/play-mode';
import { CHORD_FINGERS } from '@domain/music/chords/chord-fingers';
import { CHORD_SHAPES } from '@domain/music/chords/chord-shapes';
import { findPosition } from '@domain/music/find-position';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

/** Fingertips sit just behind the fret wire, not in the middle of the gap. */
const BEHIND_FRET = 0.72;

/**
 * Where the fingers go, drawn on the real fretboard.
 *
 * @remarks
 * - Chord mode: the held (or lesson's next) chord's real fingering — numbered dots, a barre bar, ×/○ at the nut.
 * - Note mode: the held fret band, and the lesson's next note.
 * - Free mode, and the instrument playing by itself: what each fingertip is pressing, a bar where a finger lies flat across a fret; the capo bar when one is set.
 */
export function paintFingering({ ctx, player, target, now }: PaintContext): void {
  const l = player.layout;
  const fx = (fret: number) => {
    const a = l.fretX[fret - 1] ?? l.nutX;
    const b = l.fretX[fret] ?? a;
    return a + (b - a) * BEHIND_FRET;
  };
  if (player.capo > 0) paintCapo(ctx, player.layout, l.fretX[player.capo - 1] ?? l.nutX, l.fretX[player.capo] ?? l.nutX);

  if (player.isPerforming) {
    paintPresses(ctx, player, fx);
  } else if (player.mode === PlayMode.chord) {
    const isTargetOther = target?.chord !== undefined && target.chord !== player.chord;
    if (isTargetOther && target.chord) paintShape(ctx, player, target.chord, fx, 0.35 + 0.2 * Math.sin(now * 5), true);
    if (player.chord && !player.isMuted) paintShape(ctx, player, player.chord, fx, 0.95, false);
  } else if (player.mode === PlayMode.note) {
    if (player.fret > 0) band(ctx, player, player.fret, rgba(Palette.accent, 0.22));
    const pos = target?.midi === undefined ? null : findPosition(target.midi, player.instrument.tuning, l.maxFret);
    if (pos) fingerDot(ctx, pos.fret > 0 ? fx(pos.fret + player.capo) : l.nutX - 14, stringY(l, pos.string, fx(Math.max(1, pos.fret))), '', 0.45 + 0.3 * Math.sin(now * 5), true);
  } else {
    paintPresses(ctx, player, fx);
  }
}

function paintShape(ctx: CanvasRenderingContext2D, player: PaintContext['player'], chord: string, fx: (f: number) => number, alpha: number, isGhost: boolean): void {
  const l = player.layout;
  const shape = CHORD_SHAPES[chord];
  const fingers = CHORD_FINGERS[chord];
  if (!shape || l.strings !== shape.length) return;
  const capo = player.capo;
  const barreFret = barre(shape, fingers);
  if (barreFret > 0) {
    const strings = shape.map((f, i) => (f !== null && f >= barreFret ? i : -1)).filter((i) => i >= 0);
    barreBar(ctx, player, fx(barreFret + capo), strings, isGhost ? rgba(Palette.ink, alpha * 0.35) : rgba(Palette.accent, alpha * 0.85));
  }
  shape.forEach((f, i) => {
    if (f === null) {
      ctx.font = `600 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(Palette.miss, alpha);
      ctx.fillText('×', l.nutX - 14, stringY(l, i, l.nutX) + 4);
      return;
    }
    if (f === 0 || f === barreFret) return;
    fingerDot(ctx, fx(f + capo), stringY(l, i, fx(f + capo)), String(fingers?.[i] ?? ''), alpha, isGhost);
  });
}

/** Free mode: a dot per fingertip, and a bar where one finger holds several strings on a fret (a barre). */
function paintPresses(ctx: CanvasRenderingContext2D, player: PaintContext['player'], fx: (f: number) => number): void {
  const l = player.layout;
  const groups = new Map<string, { finger: number; fret: number; strings: number[] }>();
  for (const p of player.fretting?.presses ?? []) {
    const key = `${p.finger}:${p.fret}`;
    const g = groups.get(key) ?? { finger: p.finger, fret: p.fret, strings: [] };
    g.strings.push(p.string);
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    const x = fx(g.fret);
    if (g.strings.length > 1) barreBar(ctx, player, x, g.strings, rgba(Palette.accent, 0.8));
    fingerDot(ctx, x, stringY(l, Math.min(...g.strings), x), String(g.finger), 0.9, false);
  }
}

/** A rounded bar across `strings` at screen x: one finger laid flat over them. */
function barreBar(ctx: CanvasRenderingContext2D, player: PaintContext['player'], x: number, strings: readonly number[], color: string): void {
  const y0 = stringY(player.layout, Math.min(...strings), x);
  const y1 = stringY(player.layout, Math.max(...strings), x);
  ctx.beginPath();
  ctx.roundRect(x - 9, y0 - 9, 18, y1 - y0 + 18, 9);
  ctx.fillStyle = color;
  ctx.fill();
}

function barre(shape: readonly (number | null)[], fingers: readonly (number | null)[] | undefined): number {
  const index = shape.filter((f, i) => fingers?.[i] === 1 && f !== null && f > 0);
  return index.length >= 2 ? (index[0] ?? 0) : 0;
}

function fingerDot(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, alpha: number, isGhost: boolean): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = isGhost ? rgba(Palette.ink, alpha * 0.4) : rgba(Palette.accent, alpha);
  ctx.fill();
  ctx.restore();
  if (isGhost) {
    ctx.strokeStyle = rgba(Palette.ink, alpha);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!label) return;
  ctx.font = `700 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isGhost ? rgba(Palette.ink, alpha) : '#1a1408';
  ctx.fillText(label, x, y + 4);
}

function band(ctx: CanvasRenderingContext2D, player: PaintContext['player'], fret: number, color: string): void {
  const l = player.layout;
  const a = l.fretX[fret - 1] ?? l.nutX;
  const b = l.fretX[fret] ?? a;
  const top = stringY(l, 0, a) - 12;
  const bottom = stringY(l, l.strings - 1, a) + 12;
  ctx.fillStyle = color;
  ctx.fillRect(Math.min(a, b), top, Math.abs(b - a), bottom - top);
}

function paintCapo(ctx: CanvasRenderingContext2D, l: PaintContext['player']['layout'], a: number, b: number): void {
  const x = a + (b - a) * 0.8;
  const top = stringY(l, 0, x) - 16;
  const bottom = stringY(l, l.strings - 1, x) + 16;
  const metal = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
  metal.addColorStop(0, '#1c1c1e');
  metal.addColorStop(0.5, '#4a4a4f');
  metal.addColorStop(1, '#1c1c1e');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.roundRect(x - 8, top, 16, bottom - top, 6);
  ctx.fill();
}
