import type { Instrument } from '@domain/instruments/instrument';

const OCTAVE = 12;
const CENTS_PER_SEMITONE = 100;

/**
 * The fret that sounds `semitones` above the open string: the same number on a semitone neck, the nearest of a
 * saz's 17-an-octave frets (`fretCents`) on a saz.
 */
export function fretForSemitones(inst: Instrument, semitones: number): number {
  const cents = inst.fretCents;
  if (!cents?.length) return semitones;
  const octave = Math.floor(semitones / OCTAVE);
  const within = (semitones - octave * OCTAVE) * CENTS_PER_SEMITONE;
  let best = 0;
  cents.forEach((c, i) => {
    if (Math.abs(c - within) < Math.abs((cents[best] ?? 0) - within)) best = i;
  });
  return octave * cents.length + best;
}

/** How many semitones its neck reaches above an open string. */
export function semitoneSpan(inst: Instrument): number {
  let s = 0;
  while (fretForSemitones(inst, s + 1) <= inst.frets) s++;
  return s;
}

/** The lowest and highest note it can play. */
export function playableRange(inst: Instrument): { low: number; high: number } {
  return { low: Math.min(...inst.tuning), high: Math.max(...inst.tuning) + semitoneSpan(inst) };
}
