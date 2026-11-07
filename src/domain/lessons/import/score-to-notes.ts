import type { ImportedScore } from '@domain/lessons/import/imported-score';
import { midiToName } from '@domain/music/pitch';

/** Onsets are snapped to this many steps a beat: sixteenths and triplets both land exactly. */
const GRID = 12;
/** A note this far below the tune (semitones) is its bass, played under it; nearer ones are inner voices, left out. */
const BASS_BELOW = 5;
/** The song notation stops after this many onsets — a whole symphony would not make a lesson. */
const MAX_ONSETS = 1500;
/** A silence at least this long (grid steps: half a beat) between a note's end and the next onset is written as a rest. */
const MIN_REST = GRID / 2;

/**
 * An imported score in the app's song notation ("E4+C3:1 G4:0.5 r:1"): at each onset the highest note is the tune
 * and the lowest, when well below it, the bass; each lasts until the next onset.
 */
export function scoreToNotes(score: ImportedScore): string {
  const onsets = new Map<number, number[]>();
  /** Where each onset's notes end (the longest of them), in grid steps. */
  const ends = new Map<number, number>();
  for (const n of score.notes) {
    const slot = Math.round(n.beat * GRID);
    onsets.set(slot, [...(onsets.get(slot) ?? []), n.midi]);
    ends.set(slot, Math.max(ends.get(slot) ?? 0, Math.round((n.beat + n.dur) * GRID)));
  }
  const slots = [...onsets.keys()].sort((a, b) => a - b).slice(0, MAX_ONSETS);
  const end = Math.round(Math.max(...score.notes.map((n) => n.beat + n.dur)) * GRID);
  const tokens: string[] = [];
  if ((slots[0] ?? 0) > 0) tokens.push(`r:${length(slots[0] ?? 0)}`);
  slots.forEach((slot, i) => {
    const pitches = onsets.get(slot) ?? [];
    const top = Math.max(...pitches);
    const bottom = Math.min(...pitches);
    const next = slots[i + 1] ?? Math.max(end, slot + 1);
    const names = bottom <= top - BASS_BELOW ? `${midiToName(top)}+${midiToName(bottom)}` : midiToName(top);
    // A gap of half a beat or more before the next onset is a rest; a shorter one is just how the note was played.
    const sounds = Math.max(1, Math.min(next, ends.get(slot) ?? next) - slot);
    const gap = next - slot - sounds;
    if (gap >= MIN_REST) tokens.push(`${names}:${length(sounds)}`, `r:${length(gap)}`);
    else tokens.push(`${names}:${length(next - slot)}`);
  });
  return tokens.join(' ');
}

/** Grid steps as the shortest exact length: "1", "0.75", "1/3". */
function length(steps: number): string {
  const g = gcd(steps, GRID);
  const num = steps / g;
  const den = GRID / g;
  if (den === 1) return String(num);
  return [2, 4].includes(den) ? String(num / den) : `${num}/${den}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
