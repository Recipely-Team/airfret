import type { SampleRef } from '@infrastructure/audio/samples/sample-ref';

/** A decoded recording paired with the manifest entry that describes it. */
export interface AudioBufferEntry {
  readonly ref: SampleRef;
  readonly buffer: AudioBuffer;
}
