import type { AudioBufferEntry } from '@infrastructure/audio/samples/audio-buffer-entry';
import type { SampleChoice } from '@infrastructure/audio/samples/sample-choice';

/**
 * Largest measured tuning error (cents) trusted as real. Matches `tools/samples/prepare.mjs`, which already
 * discards larger measurements as analysis mistakes; a 40-cent re-pitch is inaudible as processing, a
 * 40-cent error is not (high frets of a real guitar are often that far off).
 */
const MAX_TUNING_CORRECTION = 60;
const CENTS_PER_SEMITONE = 100;
const WRONG_STRING_PENALTY = 1000;
/**
 * Semitones a recording may be re-pitched past the range it was made to cover. Beyond that it sounds
 * unnatural (chipmunk or tape-slowed), so the note is left to the string synth instead.
 */
const MAX_STRETCH = 3;

/**
 * **SampleSet** — the decoded recordings of one instrument, with the rule for choosing which one
 * voices a given note.
 *
 * @remarks
 * - Prefers a recording made on the same open string, then the nearest recorded pitch, so a note
 *   keeps the timbre of the string it is actually played on.
 * - The chosen buffer is detuned by the semitone gap to the asked pitch plus a small, trusted slice
 *   of the measured tuning error.
 * - Notes far outside every recording's range get no choice (null): the caller synthesises them.
 */
export class SampleSet {
  constructor(private readonly entries: readonly AudioBufferEntry[]) {}

  get isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /** The best recording for `midi` on open string `string` (-1 = any string). */
  choose(string: number, midi: number): SampleChoice | null {
    let best: AudioBufferEntry | null = null;
    let bestScore = Infinity;
    for (const e of this.entries) {
      const isCovered = midi >= e.ref.lo && midi <= e.ref.hi;
      const isWrongString = string >= 0 && e.ref.string >= 0 && e.ref.string !== string;
      const score = Math.abs(e.ref.midi - midi) + (isCovered ? 0 : CENTS_PER_SEMITONE) + (isWrongString ? WRONG_STRING_PENALTY : 0);
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    if (!best || midi < best.ref.lo - MAX_STRETCH || midi > best.ref.hi + MAX_STRETCH) return null;
    const correction = Math.max(-MAX_TUNING_CORRECTION, Math.min(MAX_TUNING_CORRECTION, best.ref.cents));
    return { buffer: best.buffer, detune: (midi - best.ref.midi) * CENTS_PER_SEMITONE + correction };
  }
}
