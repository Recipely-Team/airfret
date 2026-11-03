import { SEMITONES_PER_OCTAVE } from '@domain/music/note-names';
import type { RecognizedChord } from '@domain/music/chords/recognized-chord';

/** Interval sets (semitones above the root) per quality, most common first. */
const TEMPLATES: readonly [string, readonly number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['m7', [0, 3, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['5', [0, 7]],
  ['sus2', [0, 2, 7]],
  ['sus4', [0, 5, 7]],
  ['add9', [0, 2, 4, 7]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['9', [0, 2, 4, 7, 10]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
];
const SCORE = { match: 2, extra: -1.6, missing: -1.1, rootInBass: 0.6, rank: -0.01 } as const;
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Names the chord formed by `midis` (sounding notes, any order), or null for fewer than two pitch classes.
 *
 * @remarks
 * - Every pitch class present is tried as a root against every template:
 *   score = 2·matched − 1.6·extra − 1.1·missing (+0.6 when the root is the bass note).
 * - Ties go to the more common quality (earlier template).
 */
export function recognizeChord(midis: readonly number[]): RecognizedChord | null {
  if (!midis.length) return null;
  const pcs = new Set(midis.map((m) => ((m % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE));
  if (pcs.size < 2) return null;
  const bass = ((Math.min(...midis) % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
  let best = { root: 0, quality: '', score: -Infinity };
  for (const root of pcs) {
    const rel = new Set([...pcs].map((pc) => (pc - root + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE));
    for (let rank = 0; rank < TEMPLATES.length; rank++) {
      const [quality, intervals] = TEMPLATES[rank] ?? ['', []];
      const matched = intervals.filter((i) => rel.has(i)).length;
      const score =
        SCORE.match * matched + SCORE.extra * (rel.size - matched) + SCORE.missing * (intervals.length - matched) +
        (root === bass ? SCORE.rootInBass : 0) + SCORE.rank * rank;
      if (score > best.score) best = { root, quality, score };
    }
  }
  const { root, quality } = best;
  const name = `${NAMES[root] ?? ''}${quality}${bass === root ? '' : `/${NAMES[bass] ?? ''}`}`;
  return { root, quality, bass, name };
}
