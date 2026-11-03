import { stringY } from '@domain/fretboard/neck-geometry';
import { PlayMode } from '@domain/instruments/play-mode';
import { chordNotes } from '@domain/music/chord-voicing';
import { findPosition } from '@domain/music/find-position';
import { pitchClass } from '@domain/music/pitch';
import { FONT, rgba, Palette } from '@presentation/canvas/palette';
import type { PaintContext } from '@presentation/canvas/paint-context';

const STEPS = 48;
const VIBRATION_PX = 5;
const VIBRATION_HZ = 70;
const LABEL_GAP = 16;
const MUTED_MARK = '×';
const GAUGE = { guitar: { base: 2.6, step: 0.36 }, bass: { base: 3.2, step: 0.55 } } as const;
const BASS_STRINGS = 4;

/** Strings from nut to bridge, vibrating with their energy, labelled with the note they'd sound. */
export function paintStrings({ ctx, player, target, phase }: PaintContext): void {
  const l = player.layout;
  const tuning = player.instrument.tuning;
  const notes = player.mode === PlayMode.chord && player.chord ? chordNotes(player.chord, tuning) : null;
  const targetString = target?.midi === undefined ? null : findPosition(target.midi, tuning, l.maxFret)?.string;
  const gauge = l.strings === BASS_STRINGS ? GAUGE.bass : GAUGE.guitar;
  for (let i = 0; i < l.strings; i++) {
    const energy = player.energy[i] ?? 0;
    const note = notes ? notes[i] ?? null : (tuning[i] ?? 0) + (player.mode === PlayMode.note ? player.fret : 0);
    const isSilent = note === null;
    ctx.strokeStyle = i === targetString ? rgba(Palette.accent, 0.95) : rgba(Palette.ink, isSilent ? 0.18 : 0.55 + 0.4 * Math.min(1, energy));
    ctx.lineWidth = Math.max(0.8, gauge.base - i * gauge.step);
    ctx.beginPath();
    for (let k = 0; k <= STEPS; k++) {
      const u = k / STEPS;
      const x = l.nutX + (l.strumX1 - l.nutX) * u;
      const y = stringY(l, i, x) + Math.sin(Math.PI * u) * Math.sin(phase * VIBRATION_HZ + i * 1.7) * energy * VIBRATION_PX;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.font = `500 11px ${FONT}`;
    ctx.textAlign = l.isLefty ? 'right' : 'left';
    ctx.fillStyle = rgba(Palette.ink, isSilent ? 0.2 : 0.5);
    ctx.fillText(isSilent ? MUTED_MARK : pitchClass(note), l.strumX1 + (l.isLefty ? -LABEL_GAP : LABEL_GAP), stringY(l, i, l.strumX1) + 4);
  }
}
