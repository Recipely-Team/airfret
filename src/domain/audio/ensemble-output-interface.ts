/**
 * **EnsembleOutputInterface** — port for the instruments that join one playing by itself: each plays its notes from
 * its own real recordings, in the same mix and on the same clock.
 */
export interface EnsembleOutputInterface {
  /** Loads these instruments' recordings ahead of their first note (ids; the others are let go). */
  prepare(instrumentIds: readonly string[]): void;
  /** Whether an instrument has recordings an ensemble can play. */
  canPlay(instrumentId: string): boolean;
  /** One note of an ensemble instrument, `velocity` 0–1, from `when` for `dur` seconds (audio clock). */
  play(instrumentId: string, midi: number, velocity: number, when: number, dur: number): void;
  /** Ends an instrument's notes still ringing at `midi` (every one with null) at `when`: a damped key, a string fretted anew. */
  release(instrumentId: string, midi: number | null, when: number): void;
  /** Stops every ensemble note now. */
  silence(): void;
}
