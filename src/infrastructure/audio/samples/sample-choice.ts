/** How to sound one note from a sample set: which buffer, and how far to detune it (cents). */
export interface SampleChoice {
  readonly buffer: AudioBuffer;
  readonly detune: number;
  /** Where it loops while held, seconds (a sustained recording too short for long notes). */
  readonly loop?: { readonly start: number; readonly end: number };
}
