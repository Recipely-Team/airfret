import type { SampleRef } from '@infrastructure/audio/samples/sample-ref';

/** The `manifest.json` in a sample-set folder: every recorded note in the set. */
export interface SampleManifest {
  readonly samples: readonly SampleRef[];
}
