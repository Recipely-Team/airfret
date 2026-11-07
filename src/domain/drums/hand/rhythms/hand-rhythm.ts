/**
 * A rhythm a hand drum plays by itself, in steps: `subdiv` steps a beat, one token a step, a phrase looped `bars` times.
 *
 * @remarks
 * Token: `.` rest; else strokes joined by `+`, each an optional head number (0 when absent) and a letter — `D` the
 * centre stroke (düm, bass, open), `T` the edge stroke (tek, tone, na), `K` the left hand's edge stroke (ka, slap);
 * lower case is a soft ghost stroke. `0D+1T` strikes two heads at once (a tabla's dha).
 */
export interface HandRhythm {
  readonly id: string;
  /** i18n keys of its name and of a line about it. */
  readonly title: string;
  readonly about: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly subdiv: number;
  /** One or more bars of tokens. */
  readonly phrase: string;
  readonly bars: number;
  /** The drums it is played on. */
  readonly drums: readonly string[];
}
