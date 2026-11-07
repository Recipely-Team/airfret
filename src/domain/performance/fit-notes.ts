import type { TimedNote } from '@domain/performance/timed-note';

const OCTAVE = 12;
/** Octave shifts tried, either way. */
const MAX_SHIFT_OCTAVES = 4;

/**
 * A piece moved by whole octaves to sit in an instrument's range (as written, when it already does); a note still
 * outside (a bass under a glockenspiel) is folded in by octaves. A one-voice instrument (a clarinet) keeps the
 * melody alone, one note at a time.
 */
export function fitNotes(notes: readonly TimedNote[], low: number, high: number, isMonophonic: boolean): TimedNote[] {
  const kept = isMonophonic ? monophonic(notes) : [...notes];
  const melody = kept.filter((n) => n.isMelody).map((n) => n.midi);
  const line = melody.length ? melody : kept.map((n) => n.midi);
  if (!line.length) return [];
  const centre = (low + high) / 2;
  const mid = (Math.min(...line) + Math.max(...line)) / 2;
  let best = 0;
  let bestScore = -Infinity;
  for (let k = -MAX_SHIFT_OCTAVES; k <= MAX_SHIFT_OCTAVES; k++) {
    const shift = k * OCTAVE;
    const inside = line.filter((m) => m + shift >= low && m + shift <= high).length;
    // As written when it fits; otherwise the fewest octaves that bring the most of the tune in, centred.
    const score = inside * 1000 - Math.abs(k) * 100 - Math.abs(mid + shift - centre);
    if (score > bestScore) {
      bestScore = score;
      best = shift;
    }
  }
  return kept.map((n) => ({ ...n, midi: fold(n.midi + best, low, high) }));
}

function fold(midi: number, low: number, high: number): number {
  let m = midi;
  while (m < low) m += OCTAVE;
  while (m > high) m -= OCTAVE;
  return m < low ? midi : m;
}

/** The melody alone, each note ending where the next begins. */
function monophonic(notes: readonly TimedNote[]): TimedNote[] {
  const line = notes.filter((n) => n.isMelody).sort((a, b) => a.beat - b.beat);
  const out: TimedNote[] = [];
  for (const n of line) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.beat - n.beat) < 1e-6) {
      // Two melody notes at once (a chord's top voice repeated): keep the higher.
      if (n.midi > prev.midi) out[out.length - 1] = n;
      continue;
    }
    if (prev && prev.beat + prev.dur > n.beat) out[out.length - 1] = { ...prev, dur: n.beat - prev.beat };
    out.push(n);
  }
  return out;
}
