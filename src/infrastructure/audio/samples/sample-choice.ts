/** How to sound one note from a sample set: which buffer, and how far to detune it (cents). */
export interface SampleChoice {
  readonly buffer: AudioBuffer;
  readonly detune: number;
}
