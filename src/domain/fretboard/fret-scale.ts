import { SEMITONES_PER_OCTAVE } from '@domain/music/note-names';

const CENTS_PER_SEMITONE = 100;

/**
 * The pitch of each fret, in semitones above the open string, frets 0…`count`: twelve equal semitones an
 * octave (a guitar's frets), or — given one octave of fret positions in cents — that table repeated every
 * octave (a saz's 17 frets, with its in-between notes).
 */
export function fretSemitones(count: number, octaveCents?: readonly number[]): number[] {
  return Array.from({ length: count + 1 }, (_, n) => {
    if (!octaveCents?.length) return n;
    const per = octaveCents.length;
    return Math.floor(n / per) * SEMITONES_PER_OCTAVE + (octaveCents[n % per] ?? 0) / CENTS_PER_SEMITONE;
  });
}

/** Cents of a fret from its string-length ratio (3/2 → 702 c), for tables written as ratios. */
export function ratioCents(ratio: number): number {
  return SEMITONES_PER_OCTAVE * CENTS_PER_SEMITONE * Math.log2(ratio);
}
